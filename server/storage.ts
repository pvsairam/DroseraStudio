import { db } from "./db";
import { eq, desc, and, or, sql, gte } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  AdminWhitelist,
  InsertAdminWhitelist,
  MenuConfig,
  InsertMenuConfig,
  PageConfig,
  InsertPageConfig,
  ComponentConfig,
  InsertComponentConfig,
  DataSource,
  InsertDataSource,
  AppSettings,
  InsertAppSettings,
  TrapType,
  InsertTrapType,
  AlertRule,
  InsertAlertRule,
  Integration,
  InsertIntegration,
  AppearanceToken,
  InsertAppearanceToken,
  ConfigVersion,
  InsertConfigVersion,
  TrapEvent,
  InsertTrapEvent,
  TrapStatus,
  InsertTrapStatus,
  Protocol,
  InsertProtocol,
  Contract,
  InsertContract,
  BlockchainNetwork,
  InsertBlockchainNetwork,
  Runbook,
  InsertRunbook,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;

  // Admin Whitelist
  getAdminByWallet(walletAddress: string): Promise<AdminWhitelist | undefined>;
  getAllAdmins(): Promise<AdminWhitelist[]>;
  createAdmin(admin: InsertAdminWhitelist): Promise<AdminWhitelist>;
  updateAdmin(walletAddress: string, admin: Partial<InsertAdminWhitelist>): Promise<AdminWhitelist | undefined>;
  deleteAdmin(walletAddress: string): Promise<boolean>;

  // Sessions
  getSessionByToken(token: string): Promise<any | undefined>;
  createSession(userId: string, token: string, expiresAt: Date): Promise<any>;
  deleteSession(id: string): Promise<boolean>;

  // Menu Config
  getAllMenus(): Promise<MenuConfig[]>;
  getMenusByRole(role: string): Promise<MenuConfig[]>;
  createMenu(menu: InsertMenuConfig): Promise<MenuConfig>;
  updateMenu(id: string, menu: Partial<InsertMenuConfig>): Promise<MenuConfig | undefined>;
  deleteMenu(id: string): Promise<boolean>;

  // Page Config
  getAllPages(): Promise<PageConfig[]>;
  getPageByRoute(route: string): Promise<PageConfig | undefined>;
  getPagesByRole(role: string): Promise<PageConfig[]>;
  createPage(page: InsertPageConfig): Promise<PageConfig>;
  updatePage(id: string, page: Partial<InsertPageConfig>): Promise<PageConfig | undefined>;
  deletePage(id: string): Promise<boolean>;

  // Component Config
  getComponent(id: string): Promise<ComponentConfig | undefined>;
  getAllComponents(): Promise<ComponentConfig[]>;
  createComponent(component: InsertComponentConfig): Promise<ComponentConfig>;
  updateComponent(id: string, component: Partial<InsertComponentConfig>): Promise<ComponentConfig | undefined>;
  deleteComponent(id: string): Promise<boolean>;

  // Data Sources
  getDataSource(id: string): Promise<DataSource | undefined>;
  getAllDataSources(): Promise<DataSource[]>;
  getActiveDataSources(): Promise<DataSource[]>;
  createDataSource(dataSource: InsertDataSource): Promise<DataSource>;
  updateDataSource(id: string, dataSource: Partial<InsertDataSource>): Promise<DataSource | undefined>;
  deleteDataSource(id: string): Promise<boolean>;

  // App Settings
  getAppSettingByKey(key: string): Promise<AppSettings | undefined>;
  upsertAppSetting(setting: InsertAppSettings): Promise<AppSettings>;

  // Trap Types
  getTrapType(id: string): Promise<TrapType | undefined>;
  getAllTrapTypes(): Promise<TrapType[]>;
  getTrapTypeByName(name: string): Promise<TrapType | undefined>;
  createTrapType(trapType: InsertTrapType): Promise<TrapType>;
  updateTrapType(id: string, trapType: Partial<InsertTrapType>): Promise<TrapType | undefined>;
  deleteTrapType(id: string): Promise<boolean>;

  // Alert Rules
  getAlertRule(id: string): Promise<AlertRule | undefined>;
  getAllAlertRules(): Promise<AlertRule[]>;
  getActiveAlertRules(): Promise<AlertRule[]>;
  createAlertRule(alertRule: InsertAlertRule): Promise<AlertRule>;
  updateAlertRule(id: string, alertRule: Partial<InsertAlertRule>): Promise<AlertRule | undefined>;
  deleteAlertRule(id: string): Promise<boolean>;

  // Integrations
  getIntegration(id: string): Promise<Integration | undefined>;
  getAllIntegrations(): Promise<Integration[]>;
  getIntegrationsByType(type: string): Promise<Integration[]>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: string, integration: Partial<InsertIntegration>): Promise<Integration | undefined>;
  deleteIntegration(id: string): Promise<boolean>;

  // Appearance
  getActiveAppearance(theme: string): Promise<AppearanceToken | undefined>;
  getAllAppearanceTokens(): Promise<AppearanceToken[]>;
  createAppearanceToken(tokens: InsertAppearanceToken): Promise<AppearanceToken>;
  updateAppearanceToken(id: string, tokens: Partial<InsertAppearanceToken>): Promise<AppearanceToken | undefined>;
  setActiveAppearance(id: string): Promise<boolean>;

  // Config Versions
  getAllConfigVersions(): Promise<ConfigVersion[]>;
  getConfigVersion(id: string): Promise<ConfigVersion | undefined>;
  createConfigVersion(version: InsertConfigVersion): Promise<ConfigVersion>;
  
  // Trap Events
  getTrapEvent(id: string): Promise<TrapEvent | undefined>;
  getAllTrapEvents(limit?: number): Promise<TrapEvent[]>;
  getTrapEventsByChain(chainId: number, limit?: number): Promise<TrapEvent[]>;
  getTrapEventsBySeverity(severity: string, limit?: number): Promise<TrapEvent[]>;
  getTrapEventsByTxHash(txHash: string): Promise<TrapEvent[]>;
  createTrapEvent(event: InsertTrapEvent): Promise<TrapEvent>;
  updateTrapEventStatus(id: string, status: string): Promise<TrapEvent | undefined>;

  // Trap Status
  getTrapStatus(trapTypeId: string, contractAddress: string, chainId: number): Promise<TrapStatus | undefined>;
  getAllTrapStatuses(): Promise<TrapStatus[]>;
  upsertTrapStatus(status: InsertTrapStatus): Promise<TrapStatus>;

  // Protocols & Contracts
  getAllProtocols(): Promise<Protocol[]>;
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;
  getAllContracts(): Promise<Contract[]>;
  getContractsByChain(chainId: number): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;

  // Runbooks
  getAllRunbooks(): Promise<Runbook[]>;
  getRunbooksByTrapType(trapTypeId: string): Promise<Runbook[]>;
  createRunbook(runbook: InsertRunbook): Promise<Runbook>;
  updateRunbook(id: string, runbook: Partial<InsertRunbook>): Promise<Runbook | undefined>;
  deleteRunbook(id: string): Promise<boolean>;

  // Blockchain Networks
  getAllBlockchainNetworks(): Promise<BlockchainNetwork[]>;
  getEnabledBlockchainNetworks(): Promise<BlockchainNetwork[]>;
  getBlockchainNetwork(id: string): Promise<BlockchainNetwork | undefined>;
  getBlockchainNetworkByChainId(chainId: number): Promise<BlockchainNetwork | undefined>;
  createBlockchainNetwork(network: InsertBlockchainNetwork): Promise<BlockchainNetwork>;
  updateBlockchainNetwork(id: string, network: Partial<InsertBlockchainNetwork>): Promise<BlockchainNetwork | undefined>;
  deleteBlockchainNetwork(id: string): Promise<boolean>;

  // Dashboard Statistics
  getDashboardStats(): Promise<{
    totalTraps: number;
    activeChains: number;
    triggeredToday: number;
    triggeredYesterday: number;
    trapsByType: Record<string, number>;
    last7DaysEvents: number[];
  }>;
}

export class PostgresStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(schema.users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(schema.users).set({ ...user, updatedAt: new Date() }).where(eq(schema.users.id, id)).returning();
    return updated;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.walletAddress, walletAddress));
    return user;
  }

  // Admin Whitelist
  async getAdminByWallet(walletAddress: string): Promise<AdminWhitelist | undefined> {
    const [admin] = await db.select().from(schema.adminWhitelist).where(eq(schema.adminWhitelist.walletAddress, walletAddress.toLowerCase()));
    return admin;
  }

  async getAllAdmins(): Promise<AdminWhitelist[]> {
    return db.select().from(schema.adminWhitelist).orderBy(desc(schema.adminWhitelist.createdAt));
  }

  async createAdmin(admin: InsertAdminWhitelist): Promise<AdminWhitelist> {
    const [newAdmin] = await db.insert(schema.adminWhitelist).values({
      ...admin,
      walletAddress: admin.walletAddress.toLowerCase(),
    } as any).returning();
    return newAdmin;
  }

  async updateAdmin(walletAddress: string, admin: Partial<InsertAdminWhitelist>): Promise<AdminWhitelist | undefined> {
    const [updated] = await db.update(schema.adminWhitelist)
      .set({ ...admin, updatedAt: new Date() } as any)
      .where(eq(schema.adminWhitelist.walletAddress, walletAddress.toLowerCase()))
      .returning();
    return updated;
  }

  async deleteAdmin(walletAddress: string): Promise<boolean> {
    await db.delete(schema.adminWhitelist).where(eq(schema.adminWhitelist.walletAddress, walletAddress.toLowerCase()));
    return true;
  }

  // Sessions
  async getSessionByToken(token: string): Promise<any | undefined> {
    const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.token, token));
    return session;
  }

  async createSession(userId: string, token: string, expiresAt: Date): Promise<any> {
    const [session] = await db.insert(schema.sessions).values({ userId, token, expiresAt }).returning();
    return session;
  }

  async deleteSession(id: string): Promise<boolean> {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
    return true;
  }

  // Menu Config
  async getAllMenus(): Promise<MenuConfig[]> {
    return await db.select().from(schema.menuConfig).orderBy(schema.menuConfig.order);
  }

  async getMenusByRole(role: string): Promise<MenuConfig[]> {
    const menus = await db.select().from(schema.menuConfig).where(eq(schema.menuConfig.isVisible, true)).orderBy(schema.menuConfig.order);
    return menus.filter(menu => (menu.allowedRoles as string[]).includes(role) || (menu.allowedRoles as string[]).length === 0);
  }

  async createMenu(menu: InsertMenuConfig): Promise<MenuConfig> {
    const [newMenu] = await db.insert(schema.menuConfig).values(menu).returning();
    return newMenu;
  }

  async updateMenu(id: string, menu: Partial<InsertMenuConfig>): Promise<MenuConfig | undefined> {
    const [updated] = await db.update(schema.menuConfig).set({ ...menu, updatedAt: new Date() }).where(eq(schema.menuConfig.id, id)).returning();
    return updated;
  }

  async deleteMenu(id: string): Promise<boolean> {
    const result = await db.delete(schema.menuConfig).where(eq(schema.menuConfig.id, id));
    return true;
  }

  // Page Config
  async getAllPages(): Promise<PageConfig[]> {
    return await db.select().from(schema.pageConfig);
  }

  async getPageByRoute(route: string): Promise<PageConfig | undefined> {
    const [page] = await db.select().from(schema.pageConfig).where(eq(schema.pageConfig.route, route));
    return page;
  }

  async getPagesByRole(role: string): Promise<PageConfig[]> {
    const pages = await db.select().from(schema.pageConfig);
    return pages.filter(page => page.isPublic || (page.allowedRoles as string[]).includes(role) || (page.allowedRoles as string[]).length === 0);
  }

  async createPage(page: InsertPageConfig): Promise<PageConfig> {
    const [newPage] = await db.insert(schema.pageConfig).values(page).returning();
    return newPage;
  }

  async updatePage(id: string, page: Partial<InsertPageConfig>): Promise<PageConfig | undefined> {
    const [updated] = await db.update(schema.pageConfig).set({ ...page, updatedAt: new Date() }).where(eq(schema.pageConfig.id, id)).returning();
    return updated;
  }

  async deletePage(id: string): Promise<boolean> {
    await db.delete(schema.pageConfig).where(eq(schema.pageConfig.id, id));
    return true;
  }

  // Component Config
  async getComponent(id: string): Promise<ComponentConfig | undefined> {
    const [component] = await db.select().from(schema.componentConfig).where(eq(schema.componentConfig.id, id));
    return component;
  }

  async getAllComponents(): Promise<ComponentConfig[]> {
    return await db.select().from(schema.componentConfig);
  }

  async createComponent(component: InsertComponentConfig): Promise<ComponentConfig> {
    const [newComponent] = await db.insert(schema.componentConfig).values(component).returning();
    return newComponent;
  }

  async updateComponent(id: string, component: Partial<InsertComponentConfig>): Promise<ComponentConfig | undefined> {
    const [updated] = await db.update(schema.componentConfig).set({ ...component, updatedAt: new Date() }).where(eq(schema.componentConfig.id, id)).returning();
    return updated;
  }

  async deleteComponent(id: string): Promise<boolean> {
    await db.delete(schema.componentConfig).where(eq(schema.componentConfig.id, id));
    return true;
  }

  // Data Sources
  async getDataSource(id: string): Promise<DataSource | undefined> {
    const [dataSource] = await db.select().from(schema.dataSources).where(eq(schema.dataSources.id, id));
    return dataSource;
  }

  async getAllDataSources(): Promise<DataSource[]> {
    return await db.select().from(schema.dataSources);
  }

  async getActiveDataSources(): Promise<DataSource[]> {
    return await db.select().from(schema.dataSources).where(eq(schema.dataSources.isActive, true));
  }

  async createDataSource(dataSource: InsertDataSource): Promise<DataSource> {
    const [newDataSource] = await db.insert(schema.dataSources).values(dataSource).returning();
    return newDataSource;
  }

  async updateDataSource(id: string, dataSource: Partial<InsertDataSource>): Promise<DataSource | undefined> {
    const [updated] = await db.update(schema.dataSources).set({ ...dataSource, updatedAt: new Date() }).where(eq(schema.dataSources.id, id)).returning();
    return updated;
  }

  async deleteDataSource(id: string): Promise<boolean> {
    await db.delete(schema.dataSources).where(eq(schema.dataSources.id, id));
    return true;
  }

  // App Settings
  async getAppSettingByKey(key: string): Promise<AppSettings | undefined> {
    const [setting] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, key));
    return setting;
  }

  async upsertAppSetting(setting: InsertAppSettings): Promise<AppSettings> {
    const existing = await this.getAppSettingByKey(setting.key);
    
    if (existing) {
      const [updated] = await db
        .update(schema.appSettings)
        .set({ ...setting, updatedAt: new Date() })
        .where(eq(schema.appSettings.key, setting.key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(schema.appSettings).values(setting).returning();
      return created;
    }
  }

  // Trap Types
  async getTrapType(id: string): Promise<TrapType | undefined> {
    const [trapType] = await db.select().from(schema.trapTypes).where(eq(schema.trapTypes.id, id));
    return trapType;
  }

  async getAllTrapTypes(): Promise<TrapType[]> {
    return await db.select().from(schema.trapTypes);
  }

  async getTrapTypeByName(name: string): Promise<TrapType | undefined> {
    const [trapType] = await db.select().from(schema.trapTypes).where(eq(schema.trapTypes.name, name));
    return trapType;
  }

  async createTrapType(trapType: InsertTrapType): Promise<TrapType> {
    const [newTrapType] = await db.insert(schema.trapTypes).values(trapType).returning();
    return newTrapType;
  }

  async updateTrapType(id: string, trapType: Partial<InsertTrapType>): Promise<TrapType | undefined> {
    const [updated] = await db.update(schema.trapTypes).set({ ...trapType, updatedAt: new Date() }).where(eq(schema.trapTypes.id, id)).returning();
    return updated;
  }

  async deleteTrapType(id: string): Promise<boolean> {
    await db.delete(schema.trapTypes).where(eq(schema.trapTypes.id, id));
    return true;
  }

  // Alert Rules
  async getAlertRule(id: string): Promise<AlertRule | undefined> {
    const [alertRule] = await db.select().from(schema.alertRules).where(eq(schema.alertRules.id, id));
    return alertRule;
  }

  async getAllAlertRules(): Promise<AlertRule[]> {
    return await db.select().from(schema.alertRules);
  }

  async getActiveAlertRules(): Promise<AlertRule[]> {
    return await db.select().from(schema.alertRules).where(eq(schema.alertRules.isActive, true));
  }

  async createAlertRule(alertRule: InsertAlertRule): Promise<AlertRule> {
    const [newAlertRule] = await db.insert(schema.alertRules).values(alertRule).returning();
    return newAlertRule;
  }

  async updateAlertRule(id: string, alertRule: Partial<InsertAlertRule>): Promise<AlertRule | undefined> {
    const [updated] = await db.update(schema.alertRules).set({ ...alertRule, updatedAt: new Date() }).where(eq(schema.alertRules.id, id)).returning();
    return updated;
  }

  async deleteAlertRule(id: string): Promise<boolean> {
    await db.delete(schema.alertRules).where(eq(schema.alertRules.id, id));
    return true;
  }

  // Integrations
  async getIntegration(id: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(schema.integrations).where(eq(schema.integrations.id, id));
    return integration;
  }

  async getAllIntegrations(): Promise<Integration[]> {
    return await db.select().from(schema.integrations);
  }

  async getIntegrationsByType(type: string): Promise<Integration[]> {
    return await db.select().from(schema.integrations).where(eq(schema.integrations.type, type));
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [newIntegration] = await db.insert(schema.integrations).values(integration).returning();
    return newIntegration;
  }

  async updateIntegration(id: string, integration: Partial<InsertIntegration>): Promise<Integration | undefined> {
    const [updated] = await db.update(schema.integrations).set({ ...integration, updatedAt: new Date() }).where(eq(schema.integrations.id, id)).returning();
    return updated;
  }

  async deleteIntegration(id: string): Promise<boolean> {
    await db.delete(schema.integrations).where(eq(schema.integrations.id, id));
    return true;
  }

  // Appearance
  async getActiveAppearance(theme: string): Promise<AppearanceToken | undefined> {
    const [appearance] = await db.select().from(schema.appearanceTokens)
      .where(and(eq(schema.appearanceTokens.theme, theme), eq(schema.appearanceTokens.isActive, true)));
    return appearance;
  }

  async getAllAppearanceTokens(): Promise<AppearanceToken[]> {
    return await db.select().from(schema.appearanceTokens);
  }

  async createAppearanceToken(tokens: InsertAppearanceToken): Promise<AppearanceToken> {
    const [newToken] = await db.insert(schema.appearanceTokens).values(tokens).returning();
    return newToken;
  }

  async updateAppearanceToken(id: string, tokens: Partial<InsertAppearanceToken>): Promise<AppearanceToken | undefined> {
    const [updated] = await db.update(schema.appearanceTokens).set({ ...tokens, updatedAt: new Date() }).where(eq(schema.appearanceTokens.id, id)).returning();
    return updated;
  }

  async setActiveAppearance(id: string): Promise<boolean> {
    // Deactivate all first
    await db.update(schema.appearanceTokens).set({ isActive: false });
    // Activate the selected one
    await db.update(schema.appearanceTokens).set({ isActive: true }).where(eq(schema.appearanceTokens.id, id));
    return true;
  }

  // Config Versions
  async getAllConfigVersions(): Promise<ConfigVersion[]> {
    return await db.select().from(schema.configVersions).orderBy(desc(schema.configVersions.createdAt));
  }

  async getConfigVersion(id: string): Promise<ConfigVersion | undefined> {
    const [version] = await db.select().from(schema.configVersions).where(eq(schema.configVersions.id, id));
    return version;
  }

  async createConfigVersion(version: InsertConfigVersion): Promise<ConfigVersion> {
    const [newVersion] = await db.insert(schema.configVersions).values(version).returning();
    return newVersion;
  }

  // Trap Events
  async getTrapEvent(id: string): Promise<TrapEvent | undefined> {
    const [event] = await db.select().from(schema.trapEvents).where(eq(schema.trapEvents.id, id));
    return event;
  }

  async getAllTrapEvents(limit = 100): Promise<TrapEvent[]> {
    return await db.select().from(schema.trapEvents).orderBy(desc(schema.trapEvents.blockTimestamp)).limit(limit);
  }

  async getTrapEventsByChain(chainId: number, limit = 100): Promise<TrapEvent[]> {
    return await db.select().from(schema.trapEvents).where(eq(schema.trapEvents.chainId, chainId)).orderBy(desc(schema.trapEvents.blockTimestamp)).limit(limit);
  }

  async getTrapEventsBySeverity(severity: string, limit = 100): Promise<TrapEvent[]> {
    return await db.select().from(schema.trapEvents).where(eq(schema.trapEvents.severity, severity)).orderBy(desc(schema.trapEvents.blockTimestamp)).limit(limit);
  }

  async getTrapEventsByTxHash(txHash: string): Promise<TrapEvent[]> {
    return await db.select().from(schema.trapEvents).where(eq(schema.trapEvents.txHash, txHash));
  }

  async createTrapEvent(event: InsertTrapEvent): Promise<TrapEvent> {
    const [newEvent] = await db.insert(schema.trapEvents).values(event).returning();
    return newEvent;
  }

  async updateTrapEventStatus(id: string, status: string): Promise<TrapEvent | undefined> {
    const [updated] = await db.update(schema.trapEvents).set({ status }).where(eq(schema.trapEvents.id, id)).returning();
    return updated;
  }

  // Trap Status
  async getTrapStatus(trapTypeId: string, contractAddress: string, chainId: number): Promise<TrapStatus | undefined> {
    const [status] = await db.select().from(schema.trapStatus)
      .where(and(
        eq(schema.trapStatus.trapTypeId, trapTypeId),
        eq(schema.trapStatus.contractAddress, contractAddress),
        eq(schema.trapStatus.chainId, chainId)
      ));
    return status;
  }

  async getAllTrapStatuses(): Promise<TrapStatus[]> {
    return await db.select().from(schema.trapStatus);
  }

  async upsertTrapStatus(status: InsertTrapStatus): Promise<TrapStatus> {
    const existing = await this.getTrapStatus(status.trapTypeId, status.contractAddress, status.chainId);
    
    if (existing) {
      const [updated] = await db.update(schema.trapStatus)
        .set({ ...status, updatedAt: new Date() })
        .where(eq(schema.trapStatus.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newStatus] = await db.insert(schema.trapStatus).values(status).returning();
      return newStatus;
    }
  }

  // Protocols & Contracts
  async getAllProtocols(): Promise<Protocol[]> {
    return await db.select().from(schema.protocols);
  }

  async createProtocol(protocol: InsertProtocol): Promise<Protocol> {
    const [newProtocol] = await db.insert(schema.protocols).values(protocol).returning();
    return newProtocol;
  }

  async getAllContracts(): Promise<Contract[]> {
    return await db.select().from(schema.contracts);
  }

  async getContractsByChain(chainId: number): Promise<Contract[]> {
    return await db.select().from(schema.contracts).where(eq(schema.contracts.chainId, chainId));
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db.insert(schema.contracts).values(contract).returning();
    return newContract;
  }

  // Runbooks
  async getAllRunbooks(): Promise<Runbook[]> {
    return await db.select().from(schema.runbooks).orderBy(desc(schema.runbooks.createdAt));
  }

  async getRunbooksByTrapType(trapTypeId: string): Promise<Runbook[]> {
    return await db.select().from(schema.runbooks).where(eq(schema.runbooks.trapTypeId, trapTypeId));
  }

  async createRunbook(runbook: InsertRunbook): Promise<Runbook> {
    const [newRunbook] = await db.insert(schema.runbooks).values(runbook).returning();
    return newRunbook;
  }

  async updateRunbook(id: string, runbook: Partial<InsertRunbook>): Promise<Runbook | undefined> {
    const [updated] = await db.update(schema.runbooks).set({ ...runbook, updatedAt: new Date() }).where(eq(schema.runbooks.id, id)).returning();
    return updated;
  }

  async deleteRunbook(id: string): Promise<boolean> {
    await db.delete(schema.runbooks).where(eq(schema.runbooks.id, id));
    return true;
  }

  // Blockchain Networks
  async getAllBlockchainNetworks(): Promise<BlockchainNetwork[]> {
    return await db.select().from(schema.blockchainNetworks).orderBy(desc(schema.blockchainNetworks.createdAt));
  }

  async getEnabledBlockchainNetworks(): Promise<BlockchainNetwork[]> {
    return await db.select().from(schema.blockchainNetworks).where(eq(schema.blockchainNetworks.isEnabled, true));
  }

  async getBlockchainNetwork(id: string): Promise<BlockchainNetwork | undefined> {
    const [network] = await db.select().from(schema.blockchainNetworks).where(eq(schema.blockchainNetworks.id, id));
    return network;
  }

  async getBlockchainNetworkByChainId(chainId: number): Promise<BlockchainNetwork | undefined> {
    const [network] = await db.select().from(schema.blockchainNetworks).where(eq(schema.blockchainNetworks.chainId, chainId));
    return network;
  }

  async createBlockchainNetwork(network: InsertBlockchainNetwork): Promise<BlockchainNetwork> {
    const [newNetwork] = await db.insert(schema.blockchainNetworks).values(network).returning();
    return newNetwork;
  }

  async updateBlockchainNetwork(id: string, network: Partial<InsertBlockchainNetwork>): Promise<BlockchainNetwork | undefined> {
    const [updated] = await db.update(schema.blockchainNetworks).set({ ...network, updatedAt: new Date() }).where(eq(schema.blockchainNetworks.id, id)).returning();
    return updated;
  }

  async deleteBlockchainNetwork(id: string): Promise<boolean> {
    await db.delete(schema.blockchainNetworks).where(eq(schema.blockchainNetworks.id, id));
    return true;
  }

  // Dashboard Statistics
  async getDashboardStats() {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all trap statuses
    const trapStatuses = await this.getAllTrapStatuses();
    
    // Get trap events from last 7 days with proper date filtering
    const recentEvents = await db
      .select()
      .from(schema.trapEvents)
      .where(sql`${schema.trapEvents.blockTimestamp} >= ${sevenDaysAgo}`)
      .orderBy(desc(schema.trapEvents.blockTimestamp));

    // Filter events by date ranges in memory (since we need all for grouping)
    const eventsLast7Days = recentEvents.filter(
      (e) => new Date(e.blockTimestamp) >= sevenDaysAgo
    );
    
    const eventsToday = eventsLast7Days.filter(
      (e) => new Date(e.blockTimestamp) >= today
    );
    
    const eventsYesterday = eventsLast7Days.filter(
      (e) => new Date(e.blockTimestamp) >= yesterday && new Date(e.blockTimestamp) < today
    );

    // Count active chains from recent events
    const activeChains = new Set(eventsLast7Days.map((e) => e.chainId)).size;

    // Group events by day for last 7 days
    const last7DaysEvents = Array(7).fill(0);
    eventsLast7Days.forEach((event) => {
      const eventDate = new Date(event.blockTimestamp);
      const eventDayStart = new Date(eventDate);
      eventDayStart.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - eventDayStart.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff < 7) {
        last7DaysEvents[6 - daysDiff]++;
      }
    });

    // Count traps by type - fetch trap type names
    const trapTypes = await this.getAllTrapTypes();
    const trapTypeMap = new Map(trapTypes.map(t => [t.id, t.name]));
    
    const trapsByType: Record<string, number> = {};
    trapStatuses.forEach((status) => {
      const key = trapTypeMap.get(status.trapTypeId) || "Unknown";
      trapsByType[key] = (trapsByType[key] || 0) + 1;
    });

    return {
      totalTraps: trapStatuses.length,
      activeChains,
      triggeredToday: eventsToday.length,
      triggeredYesterday: eventsYesterday.length,
      trapsByType,
      last7DaysEvents,
    };
  }
}

export const storage = new PostgresStorage();
