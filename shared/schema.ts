import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========== Authentication & Authorization ==========

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique(),
  walletAddress: text("wallet_address").unique(),
  name: text("name"),
  role: text("role").notNull().default("viewer"), // admin, operator, viewer
  nonce: text("nonce"), // For wallet signature verification
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: jsonb("permissions").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin whitelist for wallet-based access control
export const adminWhitelist = pgTable("admin_whitelist", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletAddress: text("wallet_address").notNull().unique(),
  role: text("role").notNull(), // master_admin, admin, viewer
  permissions: jsonb("permissions").$type<{
    trapTypes?: { read: boolean; write: boolean };
    alertRules?: { read: boolean; write: boolean };
    integrations?: { read: boolean; write: boolean };
    dataSources?: { read: boolean; write: boolean };
    pageConfig?: { read: boolean; write: boolean };
    menuConfig?: { read: boolean; write: boolean };
    componentConfig?: { read: boolean; write: boolean };
  }>(),
  addedBy: text("added_by"), // wallet address of who added this admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== Configuration Tables ==========

export const menuConfig = pgTable("menu_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  route: text("route").notNull(),
  icon: text("icon").notNull(),
  order: integer("order").notNull().default(0),
  allowedRoles: jsonb("allowed_roles").notNull().default([]),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pageConfig = pgTable("page_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: text("page_id").notNull().unique(),
  title: text("title").notNull(),
  route: text("route").notNull().unique(),
  description: text("description"),
  layoutSpec: jsonb("layout_spec").notNull().default({}),
  allowedRoles: jsonb("allowed_roles").notNull().default([]),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const componentConfig = pgTable("component_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  componentType: text("component_type").notNull(), // CounterCard, TimeseriesChart, DonutChart, etc.
  dataSourceId: uuid("data_source_id").references(() => dataSources.id, { onDelete: "set null" }),
  fieldMapping: jsonb("field_mapping").notNull().default({}),
  transformPipeline: jsonb("transform_pipeline").notNull().default([]),
  refreshMode: text("refresh_mode").notNull().default("static"), // push, poll, static
  timeWindow: text("time_window"),
  thresholds: jsonb("thresholds").notNull().default({}),
  alertBindings: jsonb("alert_bindings").notNull().default([]),
  styleTokens: jsonb("style_tokens").notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dataSources = pgTable("data_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(), // onchain, rest, graphql, sql, static
  config: jsonb("config").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appSettings = pgTable("app_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(), // 'theme', 'branding', etc.
  value: jsonb("value").notNull().default({}),
  updatedBy: text("updated_by"), // wallet address
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trapTypes = pgTable("trap_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // security, liquidity, governance, oracle
  description: text("description"),
  expectedEventSignatures: jsonb("expected_event_signatures").notNull().default([]),
  severity: text("severity").notNull().default("medium"),
  defaultThresholds: jsonb("default_thresholds").notNull().default({}),
  remediationHints: text("remediation_hints"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const alertRules = pgTable("alert_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  triggerType: text("trigger_type").notNull(), // frequency, condition, anomaly, status_change, sla_breach
  conditions: jsonb("conditions").notNull().default({}),
  actions: jsonb("actions").notNull().default([]), // discord, telegram, email, webhook
  templateVariables: jsonb("template_variables").notNull().default({}),
  quietHours: jsonb("quiet_hours").notNull().default({}),
  dedupInterval: integer("dedup_interval").default(300), // seconds
  rateLimit: integer("rate_limit").default(10), // per hour
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const alertDeliveries = pgTable("alert_deliveries", {
  id: uuid("id").primaryKey().defaultRandom(),
  alertRuleId: uuid("alert_rule_id").references(() => alertRules.id, { onDelete: "cascade" }).notNull(),
  channel: text("channel").notNull(), // discord, telegram, email, webhook
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(), // rpc_endpoint, discord, telegram, email, indexer
  config: jsonb("config").notNull().default({}),
  credentials: jsonb("credentials").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appearanceTokens = pgTable("appearance_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  theme: text("theme").notNull().default("dark"), // light, dark
  tokens: jsonb("tokens").notNull().default({}),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const configVersions = pgTable("config_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  description: text("description"),
  configSnapshot: jsonb("config_snapshot").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== Trap Data Tables ==========

export const blockchainNetworks = pgTable("blockchain_networks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // e.g., "Hoodi Testnet", "Sepolia", "Ethereum Mainnet"
  chainId: integer("chain_id").notNull().unique(),
  rpcUrl: text("rpc_url").notNull(),
  droseraContractAddress: text("drosera_contract_address").notNull(),
  explorerUrl: text("explorer_url"), // e.g., "https://hoodi.etherscan.io"
  isEnabled: boolean("is_enabled").notNull().default(true),
  isTestnet: boolean("is_testnet").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const protocols = pgTable("protocols", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  chainId: integer("chain_id").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().defaultRandom(),
  address: text("address").notNull(),
  chainId: integer("chain_id").notNull(),
  protocolId: uuid("protocol_id").references(() => protocols.id, { onDelete: "set null" }),
  name: text("name"),
  abi: jsonb("abi"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trapEvents = pgTable("trap_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  trapTypeId: uuid("trap_type_id").references(() => trapTypes.id, { onDelete: "set null" }),
  chainId: integer("chain_id").notNull(),
  contractAddress: text("contract_address").notNull(),
  blockNumber: integer("block_number").notNull(),
  blockTimestamp: timestamp("block_timestamp").notNull(),
  txHash: text("tx_hash").notNull(),
  eventSignature: text("event_signature").notNull(),
  parsedFields: jsonb("parsed_fields").notNull().default({}),
  severity: text("severity").notNull().default("info"),
  status: text("status").notNull().default("pending"), // pending, active, resolved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trapStatus = pgTable("trap_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  trapTypeId: uuid("trap_type_id").references(() => trapTypes.id, { onDelete: "cascade" }).notNull(),
  contractAddress: text("contract_address").notNull(),
  chainId: integer("chain_id").notNull(),
  status: text("status").notNull().default("dormant"), // active, dormant, triggered
  lastTriggered: timestamp("last_triggered"),
  triggerCount: integer("trigger_count").notNull().default(0),
  metadata: jsonb("metadata").notNull().default({}),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const runbooks = pgTable("runbooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  trapTypeId: uuid("trap_type_id").references(() => trapTypes.id, { onDelete: "set null" }),
  tags: jsonb("tags").notNull().default([]),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== Insert Schemas ==========

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
export const insertAdminWhitelistSchema = createInsertSchema(adminWhitelist).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMenuConfigSchema = createInsertSchema(menuConfig).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPageConfigSchema = createInsertSchema(pageConfig).omit({ id: true, createdAt: true, updatedAt: true });
export const insertComponentConfigSchema = createInsertSchema(componentConfig).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDataSourceSchema = createInsertSchema(dataSources).omit({ id: true, createdAt: true, updatedAt: true, lastSync: true });
export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTrapTypeSchema = createInsertSchema(trapTypes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAlertRuleSchema = createInsertSchema(alertRules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAlertDeliverySchema = createInsertSchema(alertDeliveries).omit({ id: true, createdAt: true, sentAt: true });
export const insertIntegrationSchema = createInsertSchema(integrations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAppearanceTokenSchema = createInsertSchema(appearanceTokens).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConfigVersionSchema = createInsertSchema(configVersions).omit({ id: true, createdAt: true });
export const insertBlockchainNetworkSchema = createInsertSchema(blockchainNetworks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProtocolSchema = createInsertSchema(protocols).omit({ id: true, createdAt: true });
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true });
export const insertTrapEventSchema = createInsertSchema(trapEvents).omit({ id: true, createdAt: true });
export const insertTrapStatusSchema = createInsertSchema(trapStatus).omit({ id: true, updatedAt: true });
export const insertRunbookSchema = createInsertSchema(runbooks).omit({ id: true, createdAt: true, updatedAt: true });

// ========== Select Types ==========

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type AdminWhitelist = typeof adminWhitelist.$inferSelect;
export type InsertAdminWhitelist = z.infer<typeof insertAdminWhitelistSchema>;

export type MenuConfig = typeof menuConfig.$inferSelect;
export type InsertMenuConfig = z.infer<typeof insertMenuConfigSchema>;

export type PageConfig = typeof pageConfig.$inferSelect;
export type InsertPageConfig = z.infer<typeof insertPageConfigSchema>;

export type ComponentConfig = typeof componentConfig.$inferSelect;
export type InsertComponentConfig = z.infer<typeof insertComponentConfigSchema>;

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;

export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;

export type TrapType = typeof trapTypes.$inferSelect;
export type InsertTrapType = z.infer<typeof insertTrapTypeSchema>;

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;

export type AlertDelivery = typeof alertDeliveries.$inferSelect;
export type InsertAlertDelivery = z.infer<typeof insertAlertDeliverySchema>;

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;

export type AppearanceToken = typeof appearanceTokens.$inferSelect;
export type InsertAppearanceToken = z.infer<typeof insertAppearanceTokenSchema>;

export type ConfigVersion = typeof configVersions.$inferSelect;
export type InsertConfigVersion = z.infer<typeof insertConfigVersionSchema>;

export type BlockchainNetwork = typeof blockchainNetworks.$inferSelect;
export type InsertBlockchainNetwork = z.infer<typeof insertBlockchainNetworkSchema>;

export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = z.infer<typeof insertProtocolSchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type TrapEvent = typeof trapEvents.$inferSelect;
export type InsertTrapEvent = z.infer<typeof insertTrapEventSchema>;

export type TrapStatus = typeof trapStatus.$inferSelect;
export type InsertTrapStatus = z.infer<typeof insertTrapStatusSchema>;

export type Runbook = typeof runbooks.$inferSelect;
export type InsertRunbook = z.infer<typeof insertRunbookSchema>;
