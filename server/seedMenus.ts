import { db } from "./db";
import { menuConfig } from "@shared/schema";

export async function seedMenus() {
  const existingMenus = await db.select().from(menuConfig);
  
  if (existingMenus.length > 0) {
    console.log("✓ Menus already seeded, skipping...");
    return;
  }

  const defaultMenus = [
    {
      name: "Overview",
      route: "/overview",
      icon: "LayoutDashboard",
      order: 1,
      allowedRoles: ["master_admin", "admin", "viewer"],
      isVisible: true,
    },
    {
      name: "Explorer",
      route: "/explorer",
      icon: "Search",
      order: 2,
      allowedRoles: ["master_admin", "admin", "viewer"],
      isVisible: true,
    },
    {
      name: "Alerts",
      route: "/alerts",
      icon: "Bell",
      order: 3,
      allowedRoles: ["master_admin", "admin", "viewer"],
      isVisible: true,
    },
    {
      name: "Runbooks",
      route: "/runbooks",
      icon: "BookOpen",
      order: 4,
      allowedRoles: ["master_admin", "admin", "viewer"],
      isVisible: true,
    },
    {
      name: "Admin Console",
      route: "/admin",
      icon: "Settings",
      order: 5,
      allowedRoles: ["master_admin", "admin"],
      isVisible: true,
    },
    {
      name: "Blockchain Networks",
      route: "/admin/networks",
      icon: "Globe",
      order: 6,
      allowedRoles: ["master_admin", "admin"],
      isVisible: true,
    },
  ];

  await db.insert(menuConfig).values(defaultMenus);
  console.log("✓ Default menus seeded successfully");
}
