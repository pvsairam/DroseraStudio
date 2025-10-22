import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useQuery } from "@tanstack/react-query";
import { getIconComponent } from "@/lib/iconMapper";
import type { MenuConfig } from "@shared/schema";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen = true, onClose, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useWalletAuth();

  const { data: menus = [], isLoading, error } = useQuery<MenuConfig[]>({
    queryKey: ["/api/config/menus"],
    staleTime: 30000,
    retry: 3,
  });

  const visibleMenuItems = menus
    .filter((menu) => {
      if (!menu.isVisible) return false;
      
      const allowedRoles = menu.allowedRoles as string[];
      if (!allowedRoles || allowedRoles.length === 0) return true;
      
      return user?.role && allowedRoles.includes(user.role);
    })
    .sort((a, b) => a.order - b.order);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border",
          "lg:static lg:translate-x-0",
          !isOpen && "lg:hidden"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2" data-testid="link-logo">
              <Shield className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold text-sidebar-foreground">
                Drosera Studio
              </span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
              data-testid="button-close-sidebar"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {isLoading ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Loading menu...
              </div>
            ) : error ? (
              <div className="text-sm text-destructive text-center py-4 px-2">
                Failed to load menu. Please refresh.
              </div>
            ) : visibleMenuItems.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No menu items configured
              </div>
            ) : (
              visibleMenuItems.map((item) => {
                const Icon = getIconComponent(item.icon);
                const isActive = location === item.route;

                return (
                  <Link 
                    key={item.id} 
                    href={item.route}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors hover-elevate",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground"
                    )}
                    data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })
            )}
          </nav>
        </div>
      </motion.aside>
    </>
  );
}
