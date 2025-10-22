import { createPublicClient, http, parseAbiItem, type Log, defineChain } from 'viem';
import { storage } from './storage';
import type { InsertTrapEvent, BlockchainNetwork } from '@shared/schema';

// Dynamic network configuration - loaded from database
let networkConfig: BlockchainNetwork | null = null;
let client: any = null;

// Initialize indexer with network from database
async function initializeNetwork() {
  const networks = await storage.getEnabledBlockchainNetworks();
  if (networks.length === 0) {
    console.error('❌ No enabled blockchain networks found in database');
    return false;
  }
  
  networkConfig = networks[0]; // Use first enabled network
  
  // Define custom chain for Hoodi testnet
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

// Drosera event signatures we want to monitor
const EVENT_SIGNATURES = [
  'TrapTriggered(address indexed trap, uint256 blockNumber, bytes32 indexed txHash)',
  'ResponseExecuted(address indexed trap, address indexed target, bytes data)',
  'OperatorClaimed(address indexed operator, address indexed trap, uint256 blockNumber)',
] as const;

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
 * Fetches actual block timestamp from blockchain
 */
async function parseEventLog(log: Log): Promise<TrapEventData | null> {
  try {
    const blockNumber = log.blockNumber;
    const txHash = log.transactionHash;
    const logIndex = log.logIndex;
    
    if (!blockNumber || !txHash || logIndex === null || logIndex === undefined) return null;

    // Fetch actual block data to get real timestamp
    const block = await client.getBlock({ blockNumber });
    const timestamp = new Date(Number(block.timestamp) * 1000);

    return {
      trapAddress: log.address,
      blockNumber,
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
      severity: 'high',
      status: 'active',
    };

    await storage.createTrapEvent(event);
    console.log(`✅ Stored trap event: ${eventData.txHash}[${eventData.logIndex}]`);
  } catch (error) {
    console.error('Error storing trap event:', error);
  }
}

/**
 * Fetch historical events from Drosera contract
 */
async function fetchHistoricalEvents(fromBlock: bigint, toBlock: bigint): Promise<void> {
  console.log(`🔍 Fetching events from block ${fromBlock} to ${toBlock}...`);

  try {
    // Get all trap types to map events
    const trapTypes = await storage.getAllTrapTypes();
    const defaultTrapType = trapTypes[0]?.id;

    if (!defaultTrapType) {
      console.error('❌ No trap types found in database. Please create trap types first.');
      return;
    }

    // Fetch logs for TrapTriggered event
    const logs = await client.getLogs({
      address: DROSERA_CONTRACT,
      events: [parseAbiItem('event TrapTriggered(address indexed trap, uint256 blockNumber, bytes32 indexed txHash)')],
      fromBlock,
      toBlock,
    });

    console.log(`📦 Found ${logs.length} events`);

    for (const log of logs) {
      const eventData = await parseEventLog(log);
      if (eventData) {
        await storeTrapEvent(eventData, defaultTrapType);
      }
    }

    console.log(`✨ Processed ${logs.length} historical events`);
  } catch (error: any) {
    // If specific event doesn't exist, try generic logs
    console.log('⚠️  Specific events not found, fetching all contract logs...');
    
    try {
      const logs = await client.getLogs({
        address: DROSERA_CONTRACT,
        fromBlock,
        toBlock,
      });

      console.log(`📦 Found ${logs.length} generic logs from Drosera contract`);
      
      const trapTypes = await storage.getAllTrapTypes();
      const defaultTrapType = trapTypes[0]?.id;

      if (defaultTrapType && logs.length > 0) {
        // Store first few logs as sample trap events
        for (const log of logs.slice(0, 5)) {
          const eventData = await parseEventLog(log);
          if (eventData) {
            await storeTrapEvent(eventData, defaultTrapType);
          }
        }
      }
    } catch (genericError) {
      console.error('❌ Error fetching logs:', genericError);
    }
  }
}

/**
 * Watch for new real-time events from Drosera contract
 * Uses generic log watcher since specific ABI events may not exist
 */
export function startEventWatcher(): void {
  console.log('👀 Starting real-time event watcher for Drosera contract...');
  console.log(`📡 Monitoring: ${DROSERA_CONTRACT} on Holesky testnet`);

  // Watch for all events from the contract (no ABI required)
  const unwatch = client.watchEvent({
    address: DROSERA_CONTRACT,
    onLogs: async (logs: Log[]) => {
      console.log(`🔔 New events detected: ${logs.length}`);
      
      const trapTypes = await storage.getAllTrapTypes();
      const defaultTrapType = trapTypes[0]?.id;

      if (!defaultTrapType) return;

      for (const log of logs) {
        const eventData = await parseEventLog(log);
        if (eventData) {
          await storeTrapEvent(eventData, defaultTrapType);
        }
      }
    },
    onError: (error: Error) => {
      console.error('⚠️  Event watcher error:', error);
      // Auto-restart watcher on error
      setTimeout(() => {
        console.log('🔄 Restarting event watcher...');
        startEventWatcher();
      }, 5000);
    },
  });

  console.log('✅ Event watcher started successfully');
}

/**
 * Initialize indexer: fetch historical data and start watching
 */
export async function initializeIndexer(): Promise<void> {
  console.log('🚀 Initializing Drosera blockchain indexer...');
  console.log(`🔗 Chain: Holesky (${holesky.id})`);
  console.log(`📍 Contract: ${DROSERA_CONTRACT}`);
  console.log(`🌐 RPC: ${HOLESKY_RPC}`);

  try {
    // Get current block
    const currentBlock = await client.getBlockNumber();
    console.log(`📊 Current block: ${currentBlock}`);

    // Fetch last 1000 blocks of history
    const fromBlock = currentBlock - BigInt(1000);
    
    // Fetch historical events
    await fetchHistoricalEvents(fromBlock, currentBlock);

    // Start watching for new events
    startEventWatcher();

    console.log('✨ Indexer initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize indexer:', error);
  }
}

// Export for use in main server
export { DROSERA_CONTRACT, HOLESKY_RPC };
