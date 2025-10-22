import { db } from "./db";
import * as schema from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const [demoUser] = await db.insert(schema.users).values({
    email: "operator@drosera.io",
    name: "Demo Operator",
    role: "admin",
  }).returning();
  console.log("✓ Created demo user");

  // Create roles
  await db.insert(schema.roles).values([
    {
      name: "admin",
      description: "Full access to all features",
      permissions: { all: true },
    },
    {
      name: "operator",
      description: "Can view and manage traps, alerts, and events",
      permissions: { view: true, manage_traps: true, manage_alerts: true },
    },
    {
      name: "viewer",
      description: "Read-only access to dashboards",
      permissions: { view: true },
    },
  ]);
  console.log("✓ Created roles");

  // Create menu configuration
  await db.insert(schema.menuConfig).values([
    {
      name: "Overview",
      route: "/overview",
      icon: "LayoutDashboard",
      order: 1,
      allowedRoles: ["admin", "operator", "viewer"],
      isVisible: true,
    },
    {
      name: "Explorer",
      route: "/explorer",
      icon: "Search",
      order: 2,
      allowedRoles: ["admin", "operator", "viewer"],
      isVisible: true,
    },
    {
      name: "Alerts",
      route: "/alerts",
      icon: "Bell",
      order: 3,
      allowedRoles: ["admin", "operator"],
      isVisible: true,
    },
    {
      name: "Runbooks",
      route: "/runbooks",
      icon: "BookOpen",
      order: 4,
      allowedRoles: ["admin", "operator"],
      isVisible: true,
    },
    {
      name: "Admin",
      route: "/admin",
      icon: "Settings",
      order: 5,
      allowedRoles: ["admin"],
      isVisible: true,
    },
  ]);
  console.log("✓ Created menu configuration");

  // Create trap types
  const [securityTrapType] = await db.insert(schema.trapTypes).values([
    {
      name: "Security Vault Monitor",
      category: "security",
      description: "Monitors vault contracts for unauthorized access attempts",
      expectedEventSignatures: ["UnauthorizedAccess(address,uint256)", "VaultBreach(address)"],
      severity: "critical",
      defaultThresholds: { maxAttempts: 3, timeWindow: 3600 },
      remediationHints: "1. Immediately pause the contract\n2. Investigate the unauthorized address\n3. Review access control permissions",
    },
    {
      name: "Liquidity Pool Monitor",
      category: "liquidity",
      description: "Tracks liquidity pool imbalances and drain attempts",
      expectedEventSignatures: ["LiquidityDrained(address,uint256)", "PoolImbalance(uint256,uint256)"],
      severity: "high",
      defaultThresholds: { drainPercentage: 25, imbalanceRatio: 0.3 },
      remediationHints: "1. Check pool reserves\n2. Verify trading activity\n3. Consider circuit breaker activation",
    },
    {
      name: "Governance Vote Tracker",
      category: "governance",
      description: "Monitors governance votes for anomalies and manipulation",
      expectedEventSignatures: ["VoteCast(address,uint256,bool)", "ProposalCreated(uint256)"],
      severity: "medium",
      defaultThresholds: { flashLoanVoting: true, minimumTimelock: 86400 },
      remediationHints: "1. Review voting patterns\n2. Check for flash loan usage\n3. Verify voter eligibility",
    },
    {
      name: "Oracle Price Monitor",
      category: "oracle",
      description: "Detects oracle price manipulation and deviation",
      expectedEventSignatures: ["PriceUpdated(uint256,uint256)", "PriceDeviation(uint256)"],
      severity: "high",
      defaultThresholds: { maxDeviation: 10, updateFrequency: 300 },
      remediationHints: "1. Compare with other oracles\n2. Check for MEV attacks\n3. Verify data source integrity",
    },
  ]).returning();
  console.log("✓ Created trap types");

  // Create protocols
  const [uniswap] = await db.insert(schema.protocols).values([
    { name: "Uniswap V3", chainId: 1, description: "Leading DEX protocol" },
    { name: "Aave", chainId: 1, description: "Lending protocol" },
    { name: "Compound", chainId: 1, description: "Money market protocol" },
  ]).returning();
  console.log("✓ Created protocols");

  // Create contracts
  await db.insert(schema.contracts).values([
    {
      address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      chainId: 1,
      protocolId: uniswap.id,
      name: "Uniswap Router",
    },
    {
      address: "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9",
      chainId: 1,
      name: "Aave Lending Pool",
    },
  ]);
  console.log("✓ Created contracts");

  // Create trap events (demo data)
  const now = new Date();
  await db.insert(schema.trapEvents).values([
    {
      trapTypeId: securityTrapType.id,
      chainId: 1,
      contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      blockNumber: 18500000,
      blockTimestamp: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
      txHash: "0xabc123def456789abc123def456789abc123def456789abc123def456789abc1",
      eventSignature: "UnauthorizedAccess(address,uint256)",
      parsedFields: { attacker: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", amount: "1000000000000000000" },
      severity: "critical",
      status: "active",
    },
    {
      trapTypeId: securityTrapType.id,
      chainId: 137,
      contractAddress: "0x8765432109876543210987654321098765432109",
      blockNumber: 48300000,
      blockTimestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
      txHash: "0xdef456789abc123def456789abc123def456789abc123def456789abc123def4",
      eventSignature: "VoteCast(address,uint256,bool)",
      parsedFields: { voter: "0x9999999999999999999999999999999999999999", proposalId: "42", support: true },
      severity: "high",
      status: "active",
    },
    {
      trapTypeId: securityTrapType.id,
      chainId: 42161,
      contractAddress: "0x9999111122223333444455556666777788889999",
      blockNumber: 150000000,
      blockTimestamp: new Date(now.getTime() - 12 * 60 * 1000), // 12 minutes ago
      txHash: "0x111222333444555666777888999aaabbbcccdddeeefff000111222333444555",
      eventSignature: "PriceDeviation(uint256)",
      parsedFields: { deviation: "15", oldPrice: "2000", newPrice: "2300" },
      severity: "medium",
      status: "pending",
    },
    {
      trapTypeId: securityTrapType.id,
      chainId: 10,
      contractAddress: "0x2222333344445555666677778888999900001111",
      blockNumber: 110000000,
      blockTimestamp: new Date(now.getTime() - 18 * 60 * 1000), // 18 minutes ago
      txHash: "0xaaa111bbb222ccc333ddd444eee555fff666000111222333444555666777888",
      eventSignature: "LiquidityDrained(address,uint256)",
      parsedFields: { pool: "0x1111222233334444555566667777888899990000", amount: "500000000000000000000" },
      severity: "info",
      status: "resolved",
    },
  ]);
  console.log("✓ Created trap events");

  // Create trap status
  await db.insert(schema.trapStatus).values([
    {
      trapTypeId: securityTrapType.id,
      contractAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      chainId: 1,
      status: "triggered",
      lastTriggered: new Date(now.getTime() - 2 * 60 * 1000),
      triggerCount: 3,
      metadata: { lastSeverity: "critical" },
    },
  ]);
  console.log("✓ Created trap statuses");

  // Create data sources
  await db.insert(schema.dataSources).values([
    {
      name: "Ethereum Mainnet Events",
      type: "onchain",
      config: {
        chainId: 1,
        rpcEndpoint: "https://eth-mainnet.g.alchemy.com/v2/demo",
        contracts: ["0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"],
        eventSignatures: ["Transfer(address,address,uint256)"],
        confirmationDepth: 12,
      },
      isActive: true,
    },
    {
      name: "Mock REST API",
      type: "rest",
      config: {
        baseUrl: "https://api.example.com/metrics",
        method: "GET",
        headers: { "Authorization": "Bearer demo-token" },
        responseMapping: { "$.data.count": "totalTraps", "$.data.active": "activeTraps" },
      },
      isActive: false,
    },
    {
      name: "Static Demo Data",
      type: "static",
      config: {
        data: {
          totalTraps: 1247,
          activeChains: 8,
          triggeredToday: 34,
          avgResponseTime: "2.3s",
        },
      },
      isActive: true,
    },
  ]);
  console.log("✓ Created data sources");

  // Create alert rules
  await db.insert(schema.alertRules).values([
    {
      name: "Critical Security Alert",
      triggerType: "condition",
      conditions: { severity: "critical", status: "active" },
      actions: [
        { type: "discord", webhookUrl: "https://discord.com/api/webhooks/demo" },
        { type: "email", recipients: ["security@drosera.io"] },
      ],
      templateVariables: { 
        title: "🚨 Critical Security Event",
        message: "Trap {{trapType}} triggered on {{chain}}" 
      },
      quietHours: { start: "02:00", end: "06:00" },
      dedupInterval: 300,
      rateLimit: 5,
      isActive: true,
    },
  ]);
  console.log("✓ Created alert rules");

  // Create integrations
  await db.insert(schema.integrations).values([
    {
      name: "Ethereum RPC",
      type: "rpc_endpoint",
      config: { chainId: 1, chainName: "Ethereum Mainnet" },
      credentials: { url: "https://eth-mainnet.g.alchemy.com/v2/demo" },
      isActive: true,
    },
    {
      name: "Discord Alerts",
      type: "discord",
      config: { channelName: "drosera-alerts" },
      credentials: { webhookUrl: "https://discord.com/api/webhooks/demo" },
      isActive: false,
    },
  ]);
  console.log("✓ Created integrations");

  // Create page configuration for Overview
  await db.insert(schema.pageConfig).values({
    pageId: "overview",
    title: "Overview Dashboard",
    route: "/overview",
    description: "Main monitoring dashboard with KPIs, charts, and live event feed",
    layoutSpec: {
      rows: [
        {
          id: "row-1",
          components: ["kpi-total-traps", "kpi-active-chains", "kpi-triggered-today", "kpi-avg-response"],
          gridCols: 4,
        },
        {
          id: "row-2",
          components: ["chart-timeseries", "chart-donut"],
          gridCols: [2, 1],
        },
        {
          id: "row-3",
          components: ["event-feed", "status-table"],
          gridCols: [2, 1],
        },
      ],
    },
    allowedRoles: ["admin", "operator", "viewer"],
    isPublic: false,
  });
  console.log("✓ Created page configuration");

  // Create appearance tokens (dark theme)
  await db.insert(schema.appearanceTokens).values({
    theme: "dark",
    tokens: {
      colors: {
        primary: "203 100% 50%",
        secondary: "28 100% 52%",
        success: "145 63% 42%",
        warning: "48 89% 50%",
        error: "4 78% 56%",
        background: "0 0% 7%",
        foreground: "0 0% 92%",
      },
      typography: {
        fontFamily: "Inter, system-ui, sans-serif",
        headingSize: "24px",
        bodySize: "16px",
        captionSize: "14px",
      },
      spacing: {
        base: "8px",
        small: "4px",
        medium: "16px",
        large: "24px",
      },
      radius: "12px",
      elevation: {
        sm: "0 2px 4px rgba(0,0,0,0.1)",
        md: "0 4px 16px rgba(0,0,0,0.12)",
        lg: "0 8px 24px rgba(0,0,0,0.16)",
      },
      motion: {
        springStiffness: 120,
        springDamping: 14,
        transitionDuration: "0.3s",
      },
    },
    isActive: true,
  });
  console.log("✓ Created appearance tokens");

  // Create runbook
  await db.insert(schema.runbooks).values({
    title: "Security Breach Response",
    content: `# Security Breach Response Playbook

## Immediate Actions
1. **Pause the affected contract** if possible
2. **Alert the security team** via Discord/Telegram
3. **Document all evidence** (transaction hashes, addresses, timestamps)

## Investigation Steps
1. Review the transaction on block explorer
2. Check for related suspicious activity
3. Identify the attack vector
4. Assess the scope of damage

## Remediation
1. Apply security patch if available
2. Upgrade contract if necessary
3. Coordinate with affected users
4. File incident report

## Prevention
1. Update monitoring thresholds
2. Add new trap signatures
3. Review access controls
4. Schedule security audit
`,
    trapTypeId: securityTrapType.id,
    tags: ["security", "incident-response", "high-priority"],
    createdBy: demoUser.id,
  });
  console.log("✓ Created runbook");

  console.log("✅ Database seeded successfully!");
}

seed()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
