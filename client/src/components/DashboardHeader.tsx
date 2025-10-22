import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "./ThemeToggle";
import ConnectWallet from "./ConnectWallet";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          data-testid="button-menu"
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-2 flex-1">
          {/* Search functionality to be implemented */}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
