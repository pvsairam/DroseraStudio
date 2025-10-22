import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { generateNonce, verifyWalletSignature, requireAuth, requireRole } from "./auth";
import { addClient, removeClient, broadcastToClients } from "./websocket";
import {
  insertUserSchema,
  insertAdminWhitelistSchema,
  insertMenuConfigSchema,
  insertPageConfigSchema,
  insertComponentConfigSchema,
  insertDataSourceSchema,
  insertAppSettingsSchema,
  insertTrapTypeSchema,
  insertAlertRuleSchema,
  insertIntegrationSchema,
  insertAppearanceTokenSchema,
  insertConfigVersionSchema,
  insertTrapEventSchema,
  insertTrapStatusSchema,
  insertProtocolSchema,
  insertContractSchema,
  insertRunbookSchema,
  insertBlockchainNetworkSchema,
} from "@shared/schema";

function validateRequest<T>(schema: z.Schema<T>, data: unknown): T {
  return schema.parse(data);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== Wallet Authentication ==========
  app.post("/api/auth/wallet/nonce", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }

      // Get or create user
      let user = await storage.getUserByWallet(walletAddress.toLowerCase());
      if (!user) {
        // Create new user with wallet
        user = await storage.createUser({
          walletAddress: walletAddress.toLowerCase(),
          nonce: generateNonce(),
          role: "viewer",
        });
      } else {
        // Always generate a fresh nonce for each authentication attempt
        const newNonce = generateNonce();
        user = await storage.updateUser(user.id, { nonce: newNonce }) || user;
        user.nonce = newNonce; // Ensure we return the new nonce
      }

      res.json({ nonce: user.nonce });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/wallet/login", async (req, res) => {
    try {
      const { walletAddress, signature } = req.body;
      if (!walletAddress || !signature) {
        return res.status(400).json({ error: "Wallet address and signature required" });
      }

      const user = await storage.getUserByWallet(walletAddress.toLowerCase());
      if (!user || !user.nonce) {
        return res.status(401).json({ error: "Invalid wallet address or nonce expired" });
      }

      // Verify signature
      const message = `Sign this message to authenticate with Drosera Studio.\n\nNonce: ${user.nonce}`;
      const isValid = await verifyWalletSignature(walletAddress, signature, message);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid signature" });
      }

      // Check admin whitelist and update user role accordingly
      const adminEntry = await storage.getAdminByWallet(walletAddress.toLowerCase());
      let userRole = user.role;
      
      if (adminEntry) {
        // User is in admin whitelist - update their role if it changed
        if (user.role !== adminEntry.role) {
          await storage.updateUser(user.id, { role: adminEntry.role });
          userRole = adminEntry.role;
        }
      } else {
        // Not in whitelist - ensure they're set to viewer
        if (user.role !== 'viewer') {
          await storage.updateUser(user.id, { role: 'viewer' });
          userRole = 'viewer';
        }
      }

      // Generate session token
      const token = generateNonce() + generateNonce();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create session
      const session = await storage.createSession(user.id, token, expiresAt);

      // Generate new nonce for next login
      await storage.updateUser(user.id, { nonce: generateNonce() });

      res.json({
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          name: user.name,
          role: userRole,
          permissions: adminEntry?.permissions || null,
        },
        expiresAt: session.expiresAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.substring(7);
      
      if (token) {
        const session = await storage.getSessionByToken(token);
        if (session) {
          await storage.deleteSession(session.id);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      res.json({
        id: user.id,
        walletAddress: user.walletAddress,
        name: user.name,
        role: user.role,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Admin Whitelist Management ==========
  app.get("/api/admin/whitelist", requireAuth, requireRole("master_admin", "admin"), async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      res.json(admins);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/whitelist", requireAuth, requireRole("master_admin"), async (req, res) => {
    try {
      const user = (req as any).user;
      const data = validateRequest(insertAdminWhitelistSchema, req.body);
      
      // Set addedBy to current user's wallet address
      const adminData = {
        ...data,
        addedBy: user.walletAddress,
      };
      
      const admin = await storage.createAdmin(adminData);
      res.status(201).json(admin);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admin/whitelist/:walletAddress", requireAuth, requireRole("master_admin"), async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const data = validateRequest(insertAdminWhitelistSchema.partial(), req.body);
      
      const admin = await storage.updateAdmin(walletAddress, data);
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }
      res.json(admin);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/whitelist/:walletAddress", requireAuth, requireRole("master_admin"), async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const success = await storage.deleteAdmin(walletAddress);
      if (!success) {
        return res.status(404).json({ error: "Admin not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Blockchain Networks (RPC Configuration) ==========
  app.get("/api/admin/blockchain-networks", requireAuth, requireRole("master_admin", "admin"), async (req, res) => {
    try {
      const networks = await storage.getAllBlockchainNetworks();
      res.json(networks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/blockchain-networks", requireAuth, requireRole("master_admin"), async (req, res) => {
    try {
      const data = validateRequest(insertBlockchainNetworkSchema, req.body);
      const network = await storage.createBlockchainNetwork(data);
      res.status(201).json(network);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/admin/blockchain-networks/:id", requireAuth, requireRole("master_admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const data = validateRequest(insertBlockchainNetworkSchema.partial(), req.body);
      const network = await storage.updateBlockchainNetwork(id, data);
      if (!network) {
        return res.status(404).json({ error: "Network not found" });
      }
      res.json(network);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/admin/blockchain-networks/:id", requireAuth, requireRole("master_admin"), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteBlockchainNetwork(id);
      if (!success) {
        return res.status(404).json({ error: "Network not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Users ==========
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = validateRequest(insertUserSchema, req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== Menu Configuration ==========
  app.get("/api/config/menus", async (req, res) => {
    try {
      const role = req.query.role as string;
      const menus = role 
        ? await storage.getMenusByRole(role)
        : await storage.getAllMenus();
      res.json(menus);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/config/menus", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const data = validateRequest(insertMenuConfigSchema, req.body);
      const menu = await storage.createMenu(data);
      res.status(201).json(menu);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/config/menus/:id", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const menu = await storage.updateMenu(req.params.id, req.body);
      if (!menu) return res.status(404).json({ error: "Menu not found" });
      res.json(menu);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/config/menus/:id", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      await storage.deleteMenu(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Page Configuration ==========
  app.get("/api/config/pages", async (req, res) => {
    try {
      const role = req.query.role as string;
      const pages = role 
        ? await storage.getPagesByRole(role)
        : await storage.getAllPages();
      res.json(pages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/config/pages/:route", async (req, res) => {
    try {
      const page = await storage.getPageByRoute(req.params.route);
      if (!page) return res.status(404).json({ error: "Page not found" });
      res.json(page);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/config/pages", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const data = validateRequest(insertPageConfigSchema, req.body);
      const page = await storage.createPage(data);
      res.status(201).json(page);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/config/pages/:id", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const page = await storage.updatePage(req.params.id, req.body);
      if (!page) return res.status(404).json({ error: "Page not found" });
      res.json(page);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/config/pages/:id", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      await storage.deletePage(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Component Configuration ==========
  app.get("/api/config/components", async (req, res) => {
    try {
      const components = await storage.getAllComponents();
      res.json(components);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/config/components/:id", async (req, res) => {
    try {
      const component = await storage.getComponent(req.params.id);
      if (!component) return res.status(404).json({ error: "Component not found" });
      res.json(component);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/config/components", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const data = validateRequest(insertComponentConfigSchema, req.body);
      const component = await storage.createComponent(data);
      res.status(201).json(component);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/config/components/:id", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const component = await storage.updateComponent(req.params.id, req.body);
      if (!component) return res.status(404).json({ error: "Component not found" });
      res.json(component);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/config/components/:id", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      await storage.deleteComponent(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Data Sources ==========
  app.get("/api/data-sources", async (req, res) => {
    try {
      const dataSources = await storage.getAllDataSources();
      res.json(dataSources);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/data-sources/:id", async (req, res) => {
    try {
      const dataSource = await storage.getDataSource(req.params.id);
      if (!dataSource) return res.status(404).json({ error: "Data source not found" });
      res.json(dataSource);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/data-sources", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const data = validateRequest(insertDataSourceSchema, req.body);
      const dataSource = await storage.createDataSource(data);
      res.status(201).json(dataSource);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/data-sources/:id", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const dataSource = await storage.updateDataSource(req.params.id, req.body);
      if (!dataSource) return res.status(404).json({ error: "Data source not found" });
      res.json(dataSource);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/data-sources/:id", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      await storage.deleteDataSource(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Trap Types ==========
  app.get("/api/trap-types", async (req, res) => {
    try {
      const trapTypes = await storage.getAllTrapTypes();
      res.json(trapTypes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/trap-types/:id", async (req, res) => {
    try {
      const trapType = await storage.getTrapType(req.params.id);
      if (!trapType) return res.status(404).json({ error: "Trap type not found" });
      res.json(trapType);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/trap-types", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const data = validateRequest(insertTrapTypeSchema, req.body);
      const trapType = await storage.createTrapType(data);
      res.status(201).json(trapType);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/trap-types/:id", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const trapType = await storage.updateTrapType(req.params.id, req.body);
      if (!trapType) return res.status(404).json({ error: "Trap type not found" });
      res.json(trapType);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/trap-types/:id", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      await storage.deleteTrapType(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Alert Rules ==========
  app.get("/api/alert-rules", async (req, res) => {
    try {
      const alertRules = await storage.getAllAlertRules();
      res.json(alertRules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/alert-rules", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const data = validateRequest(insertAlertRuleSchema, req.body);
      const alertRule = await storage.createAlertRule(data);
      res.status(201).json(alertRule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/alert-rules/:id", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const alertRule = await storage.updateAlertRule(req.params.id, req.body);
      if (!alertRule) return res.status(404).json({ error: "Alert rule not found" });
      res.json(alertRule);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== Integrations ==========
  app.get("/api/integrations", async (req, res) => {
    try {
      const integrations = await storage.getAllIntegrations();
      res.json(integrations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/integrations", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const data = validateRequest(insertIntegrationSchema, req.body);
      const integration = await storage.createIntegration(data);
      res.status(201).json(integration);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/integrations/:id", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const integration = await storage.updateIntegration(req.params.id, req.body);
      if (!integration) return res.status(404).json({ error: "Integration not found" });
      res.json(integration);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== Appearance ==========
  app.get("/api/appearance", async (req, res) => {
    try {
      const appearance = await storage.getAllAppearanceTokens();
      res.json(appearance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/appearance/active/:theme", async (req, res) => {
    try {
      const appearance = await storage.getActiveAppearance(req.params.theme);
      res.json(appearance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/appearance", async (req, res) => {
    try {
      const data = validateRequest(insertAppearanceTokenSchema, req.body);
      const appearance = await storage.createAppearanceToken(data);
      res.status(201).json(appearance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/appearance/:id/activate", async (req, res) => {
    try {
      await storage.setActiveAppearance(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== Config Versions ==========
  app.get("/api/config/versions", async (req, res) => {
    try {
      const versions = await storage.getAllConfigVersions();
      res.json(versions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/config/export", requireAuth, requireRole('master_admin', 'admin'), async (req, res) => {
    try {
      const configSnapshot = {
        menus: await storage.getAllMenus(),
        pages: await storage.getAllPages(),
        components: await storage.getAllComponents(),
        dataSources: await storage.getAllDataSources(),
        trapTypes: await storage.getAllTrapTypes(),
        alertRules: await storage.getAllAlertRules(),
        integrations: await storage.getAllIntegrations(),
        appearance: await storage.getAllAppearanceTokens(),
        exportedAt: new Date().toISOString(),
      };
      
      res.json(configSnapshot);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/config/versions", async (req, res) => {
    try {
      const data = validateRequest(insertConfigVersionSchema, req.body);
      const version = await storage.createConfigVersion(data);
      res.status(201).json(version);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== Theme Settings ==========
  app.get("/api/config/theme", async (req, res) => {
    try {
      const themeSetting = await storage.getAppSettingByKey('theme');
      
      // Return default theme if not set
      if (!themeSetting) {
        return res.json({
          key: 'theme',
          value: {
            preset: 'blue',
            primaryHue: 217,
            primarySaturation: 91,
            primaryLightness: 60,
          },
        });
      }
      
      res.json(themeSetting);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/config/theme", requireAuth, requireRole('master_admin'), async (req, res) => {
    try {
      const data = validateRequest(insertAppSettingsSchema, req.body);
      
      // Ensure key is 'theme'
      if (data.key !== 'theme') {
        return res.status(400).json({ error: "Invalid setting key" });
      }
      
      const setting = await storage.upsertAppSetting(data);
      res.json(setting);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== Export Configuration ==========
  app.post("/api/config/export", requireAuth, requireRole('master_admin'), async (req, res) => {
    try {
      const [
        menus,
        theme,
        trapTypes,
        dataSources,
        alertRules,
        integrations,
        blockchainNetworks,
      ] = await Promise.all([
        storage.getAllMenus(),
        storage.getAppSettingByKey('theme'),
        storage.getAllTrapTypes(),
        storage.getAllDataSources(),
        storage.getAllAlertRules(),
        storage.getAllIntegrations(),
        storage.getAllBlockchainNetworks(),
      ]);

      const config = {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        menus,
        theme: theme || {
          key: 'theme',
          value: {
            preset: 'blue',
            primaryHue: 217,
            primarySaturation: 91,
            primaryLightness: 60,
          },
        },
        trapTypes,
        dataSources,
        alertRules,
        integrations,
        blockchainNetworks,
      };

      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Trap Events ==========
  app.get("/api/trap-events", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const chainId = req.query.chainId ? parseInt(req.query.chainId as string) : undefined;
      const severity = req.query.severity as string;

      let events;
      if (chainId) {
        events = await storage.getTrapEventsByChain(chainId, limit);
      } else if (severity) {
        events = await storage.getTrapEventsBySeverity(severity, limit);
      } else {
        events = await storage.getAllTrapEvents(limit);
      }
      
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/trap-events/:id", async (req, res) => {
    try {
      const event = await storage.getTrapEvent(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/trap-events", async (req, res) => {
    try {
      const data = validateRequest(insertTrapEventSchema, req.body);
      const event = await storage.createTrapEvent(data);
      
      // Broadcast to WebSocket clients
      broadcastToClients("trap_event", event);
      
      res.status(201).json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== Trap Status ==========
  app.get("/api/trap-status", async (req, res) => {
    try {
      const statuses = await storage.getAllTrapStatuses();
      const trapTypes = await storage.getAllTrapTypes();
      const trapTypeMap = new Map(trapTypes.map(t => [t.id, t.name]));
      
      // Enrich statuses with trap type names
      const enrichedStatuses = statuses.map(status => ({
        ...status,
        trapTypeName: trapTypeMap.get(status.trapTypeId) || "Unknown",
      }));
      
      res.json(enrichedStatuses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Dashboard Statistics ==========
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== Protocols & Contracts ==========
  app.get("/api/protocols", async (req, res) => {
    try {
      const protocols = await storage.getAllProtocols();
      res.json(protocols);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/protocols", async (req, res) => {
    try {
      const data = validateRequest(insertProtocolSchema, req.body);
      const protocol = await storage.createProtocol(data);
      res.status(201).json(protocol);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/contracts", async (req, res) => {
    try {
      const chainId = req.query.chainId ? parseInt(req.query.chainId as string) : undefined;
      const contracts = chainId 
        ? await storage.getContractsByChain(chainId)
        : await storage.getAllContracts();
      res.json(contracts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      const data = validateRequest(insertContractSchema, req.body);
      const contract = await storage.createContract(data);
      res.status(201).json(contract);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ========== Runbooks ==========
  app.get("/api/runbooks", async (req, res) => {
    try {
      const trapTypeId = req.query.trapTypeId as string;
      const runbooks = trapTypeId
        ? await storage.getRunbooksByTrapType(trapTypeId)
        : await storage.getAllRunbooks();
      res.json(runbooks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/runbooks", async (req, res) => {
    try {
      const data = validateRequest(insertRunbookSchema, req.body);
      const runbook = await storage.createRunbook(data);
      res.status(201).json(runbook);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/runbooks/:id", async (req, res) => {
    try {
      const runbook = await storage.updateRunbook(req.params.id, req.body);
      if (!runbook) return res.status(404).json({ error: "Runbook not found" });
      res.json(runbook);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/runbooks/:id", async (req, res) => {
    try {
      await storage.deleteRunbook(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ========== WebSocket Server ==========
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    addClient(ws);

    ws.on("close", () => {
      removeClient(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      removeClient(ws);
    });
  });

  console.log("✓ API routes registered");
  console.log("✓ WebSocket server initialized");

  return httpServer;
}
