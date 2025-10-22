import { createPublicClient, http, parseAbiItem, type Log, defineChain } from 'viem';
import { storage } from './storage';
import { processAlertRules } from './alertService';
import { broadcastToClients } from './websocket';
import type { InsertTrapEvent, InsertTrapStatus, BlockchainNetwork } from '@shared/schema';

// Dynamic network configuration - loaded from database
let networkConfig: BlockchainNetwork | null = null;
let client: any = null;

// Block timestamp cache to reduce Infura API calls
const blockTimestampCache = new Map<bigint, Date>();
const CACHE_MAX_SIZE = 10000; // Keep last 10k blocks

// Rate limiting
let requestCount = 0;
let requestResetTime = Date.now() + 60000; // Reset every minute
const MAX_REQUESTS_PER_MINUTE = 100; // Adjust based on your Infura plan

/**
 * Rate limiter - prevents exceeding Infura API limits
 */
async function rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  
  // Reset counter every minute
  if (now > requestResetTime) {
    requestCount = 0;
    requestResetTime = now + 60000;
  }
  
  // Wait if we've hit the limit
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    const waitTime = requestResetTime - now;
    console.log(`⏳ Rate limit reached, waiting ${Math.ceil(waitTime / 1000)}s...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    requestCount = 0;
    requestResetTime = Date.now() + 60000;
  }
  
  requestCount++;
  return fn();
}

/**
 * Get block timestamp with caching to reduce API calls
 */
async function getBlockTimestamp(blockNumber: bigint): Promise<Date> {
  // Check cache first
  if (blockTimestampCache.has(blockNumber)) {
    return blockTimestampCache.get(blockNumber)!;
  }
  
  // Fetch from blockchain
  const block = await rateLimitedRequest(() => client.getBlock({ blockNumber })) as { timestamp: bigint };
  const timestamp = new Date(Number(block.timestamp) * 1000);
  
  // Add to cache
  blockTimestampCache.set(blockNumber, timestamp);
  
  // Evict oldest entries if cache is too large
  if (blockTimestampCache.size > CACHE_MAX_SIZE) {
    const oldestKey = blockTimestampCache.keys().next().value as bigint | undefined;
    if (oldestKey !== undefined) {
      blockTimestampCache.delete(oldestKey);
    }
  }
  
  return timestamp;
}

// Initialize indexer with network from database
async function initializeNetwork() {
  const networks = await storage.getEnabledBlockchainNetworks();
  if (networks.length === 0) {
    console.error('❌ No enabled blockchain networks found in database');
    return false;
  }
  
  networkConfig = networks[0]; // Use first enabled network
  
  // Define custom chain
  const customChain = defineChain({
    id: networkConfig.chainId,
    name: networkConfig.name,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [networkConfig.rpcUrl] },
    },
    blockExplorers: networkConfig.explorerUrl ? {
      default: { name: 'Explorer', url: networkConfig.explorerUrl },
    } : undefined,
  });

  client = createPublicClient({
    chain: customChain,
    transport: http(networkConfig.rpcUrl),
  });

  return true;
}

interface TrapEventData {
  trapAddress: string;
  blockNumber: bigint;
  txHash: string;
  logIndex: number;
  timestamp: Date;
  eventType: string;
}

/**
 * Parse Drosera event logs and extract trap event data
 * Uses cached block timestamps to reduce API calls
 */
async function parseEventLog(log: Log): Promise<TrapEventData | null> {
  try {
    const blockNumber = log.blockNumber;
    const txHash = log.transactionHash;
    const logIndex = log.logIndex;
    
    if (!blockNumber || !txHash || logIndex === null || logIndex === undefined) return null;

    // Use cached timestamp function
    const timestamp = await getBlockTimestamp(blockNumber as bigint);

    return {
      trapAddress: log.address,
      blockNumber: blockNumber as bigint,
      txHash,
      logIndex: Number(logIndex),
      timestamp,
      eventType: 'trap_triggered',
    };
  } catch (error) {
    console.error('Error parsing event log:', error);
    return null;
  }
}

/**
 * Update trap status based on event activity
 */
async function updateTrapStatus(
  trapTypeId: string,
  contractAddress: string,
  chainId: number,
  timestamp: Date
): Promise<void> {
  try {
    // Get existing status
    const existing = await storage.getTrapStatus(trapTypeId, contractAddress, chainId);
    
    const statusUpdate: InsertTrapStatus = {
      trapTypeId,
      contractAddress,
      chainId,
      status: 'triggered', // Event detected = triggered state
      lastTriggered: timestamp,
      triggerCount: (existing?.triggerCount || 0) + 1,
      metadata: {},
    };
    
    await storage.upsertTrapStatus(statusUpdate);
  } catch (error) {
    console.error('Error updating trap status:', error);
  }
}

/**
 * Store trap event in database with idempotency (dedupe by tx hash + log index)
 */
async function storeTrapEvent(eventData: TrapEventData, trapTypeId: string): Promise<void> {
  try {
    if (!networkConfig) return;
    
    // Check if event already exists using (txHash, logIndex) combination
    const existingEvents = await storage.getTrapEventsByTxHash(eventData.txHash);
    const duplicate = existingEvents?.find(e => {
      const parsed = e.parsedFields as any;
      return parsed?.logIndex === eventData.logIndex;
    });
    
    if (duplicate) {
      console.log(`⏭️  Skipping duplicate event: ${eventData.txHash}[${eventData.logIndex}]`);
      return;
    }

    // Get trap type to use its severity
    const trapTypes = await storage.getAllTrapTypes();
    const trapType = trapTypes.find(t => t.id === trapTypeId);
    const severity = trapType?.severity || 'high';

    const event: InsertTrapEvent = {
      trapTypeId,
      chainId: networkConfig.chainId,
      contractAddress: eventData.trapAddress,
      blockNumber: Number(eventData.blockNumber),
      blockTimestamp: eventData.timestamp,
      txHash: eventData.txHash,
      eventSignature: eventData.eventType,
      parsedFields: { 
        raw: 'Drosera trap event',
        logIndex: eventData.logIndex // Store logIndex for deduplication
      },
      severity, // Use trap type's severity
      status: 'active',
    };

    const createdEvent = await storage.createTrapEvent(event);
    console.log(`✅ Stored trap event: ${eventData.txHash}[${eventData.logIndex}]`);
    
    // Broadcast to WebSocket clients for live feed
    broadcastToClients("trap_event", createdEvent);
    
    // Update trap status to reflect this event
    await updateTrapStatus(
      trapTypeId,
      eventData.trapAddress,
      networkConfig.chainId,
      eventData.timestamp
    );

    // Process alert rules - send notifications if configured
    const trapTypeName = trapType?.name || 'Unknown Trap';
    await processAlertRules(event, trapTypeName);
  } catch (error) {
    console.error('Error storing trap event:', error);
  }
}

/**
 * Batch process events to reduce sequential API calls
 */
async function processEventsBatch(logs: Log[], trapTypeId: string): Promise<void> {
  // Group events by block number to minimize duplicate block fetches
  const eventsByBlock = new Map<bigint, Log[]>();
  
  for (const log of logs) {
    if (!log.blockNumber) continue;
    const blockNum = log.blockNumber as bigint;
    if (!eventsByBlock.has(blockNum)) {
      eventsByBlock.set(blockNum, []);
    }
    eventsByBlock.get(blockNum)!.push(log);
  }
  
  // Process each block's events
  for (const [blockNumber, blockLogs] of Array.from(eventsByBlock.entries())) {
    // Pre-fetch block timestamp once for all events in this block
    await getBlockTimestamp(blockNumber);
    
    // Now process events (they'll use cached timestamp)
    for (const log of blockLogs) {
      const eventData = await parseEventLog(log);
      if (eventData) {
        await storeTrapEvent(eventData, trapTypeId);
      }
    }
  }
}

/**
 * Fetch historical events from Drosera contract
 */
async function fetchHistoricalEvents(fromBlock: bigint, toBlock: bigint): Promise<void> {
  if (!client || !networkConfig) {
    console.error('❌ Indexer not initialized');
    return;
  }

  console.log(`🔍 Fetching events from block ${fromBlock} to ${toBlock}...`);

  try {
    const trapTypes = await storage.getAllTrapTypes();
    const defaultTrapType = trapTypes[0]?.id;

    if (!defaultTrapType) {
      console.error('❌ No trap types found in database');
      return;
    }

    // Fetch all logs from the contract
    const logs = await rateLimitedRequest(() => client.getLogs({
      address: networkConfig!.droseraContractAddress as `0x${string}`,
      fromBlock,
      toBlock,
    })) as Log[];

    console.log(`📦 Found ${logs.length} events`);

    // Process in batches for better caching efficiency
    await processEventsBatch(logs, defaultTrapType);

    console.log(`✨ Processed ${logs.length} historical events`);
    console.log(`💾 Cache size: ${blockTimestampCache.size} blocks`);
  } catch (error) {
    console.error('Error fetching historical events:', error);
  }
}

/**
 * Watch for new events in real-time using rate-limited polling
 * This replaces client.watchEvent to ensure all API calls respect rate limits
 */
let watcherInterval: NodeJS.Timeout | null = null;
let lastProcessedBlock: bigint | null = null;

export function startEventWatcher(): void {
  if (!client || !networkConfig) {
    console.error('❌ Indexer not initialized, cannot start watcher');
    return;
  }

  console.log('👀 Starting real-time event watcher for Drosera contract...');
  console.log(`📡 Monitoring: ${networkConfig.droseraContractAddress} on ${networkConfig.name}`);
  console.log(`⏱️  Poll interval: 2 seconds (ultra-responsive real-time)`);

  // Custom polling mechanism with rate limiting
  const pollForNewEvents = async () => {
    try {
      // Get current block (rate-limited)
      const currentBlock = await rateLimitedRequest(() => client.getBlockNumber()) as bigint;
      
      // Initialize lastProcessedBlock if first run
      if (!lastProcessedBlock) {
        lastProcessedBlock = currentBlock;
        return;
      }
      
      // Check if there are new blocks
      if (currentBlock <= lastProcessedBlock) {
        return; // No new blocks
      }
      
      // Fetch events from new blocks (rate-limited)
      const trapTypes = await storage.getAllTrapTypes();
      const defaultTrapType = trapTypes[0]?.id;
      
      if (!defaultTrapType) return;
      
      const logs = await rateLimitedRequest(() => client.getLogs({
        address: networkConfig!.droseraContractAddress as `0x${string}`,
        fromBlock: lastProcessedBlock! + BigInt(1),
        toBlock: currentBlock,
      })) as Log[];
      
      if (logs.length > 0) {
        console.log(`🔔 New events detected: ${logs.length}`);
        await processEventsBatch(logs, defaultTrapType);
      }
      
      lastProcessedBlock = currentBlock;
      
      // Log rate limiting stats every 10 polls
      if (requestCount % 10 === 0) {
        console.log(`📊 API calls: ${requestCount}/${MAX_REQUESTS_PER_MINUTE} per minute | Cache: ${blockTimestampCache.size} blocks`);
      }
    } catch (error) {
      console.error('⚠️  Event watcher error:', error);
    }
  };
  
  // Poll every 10 seconds (6 polls/minute = ~12-18 Infura calls/min, ~70% reduction)
  watcherInterval = setInterval(pollForNewEvents, 10000);
  
  // Initial poll
  pollForNewEvents();

  console.log('✅ Event watcher started successfully');
}

/**
 * Stop the event watcher
 */
export function stopEventWatcher(): void {
  if (watcherInterval) {
    clearInterval(watcherInterval);
    watcherInterval = null;
    console.log('🛑 Event watcher stopped');
  }
}

/**
 * Initialize indexer: fetch historical data and start watching
 */
export async function initializeIndexer(): Promise<void> {
  console.log('🚀 Initializing Drosera blockchain indexer...');
  
  // Initialize network from database
  const initialized = await initializeNetwork();
  if (!initialized || !networkConfig) {
    console.error('❌ Failed to initialize network configuration');
    return;
  }

  console.log(`🔗 Chain: ${networkConfig.name} (${networkConfig.chainId})`);
  console.log(`📍 Contract: ${networkConfig.droseraContractAddress}`);
  console.log(`🌐 RPC: ${networkConfig.rpcUrl}`);

  try {
    // Get current block
    const currentBlock = await rateLimitedRequest(() => client.getBlockNumber()) as bigint;
    console.log(`📊 Current block: ${currentBlock}`);

    // Fetch last 50 blocks of history (~10 minutes) for faster startup
    const fromBlock = currentBlock - BigInt(50);
    
    // Fetch historical events
    await fetchHistoricalEvents(fromBlock, currentBlock);

    // Start watching for new events
    startEventWatcher();

    console.log('✨ Indexer initialized successfully!');
    console.log(`📊 API calls made: ${requestCount}/${MAX_REQUESTS_PER_MINUTE} per minute`);
  } catch (error) {
    console.error('❌ Failed to initialize indexer:', error);
  }
}
