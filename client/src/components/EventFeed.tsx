import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import StatusPill from "./StatusPill";
import { ExternalLink, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TrapEvent {
  id: string;
  type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  chain: string;
  contract: string;
  timestamp: string;
  txHash: string;
  chainId?: number; // Add chainId to determine explorer URL
}

interface EventFeedProps {
  events: TrapEvent[];
  isLive?: boolean;
}

// Get blockchain explorer URL for transaction
function getExplorerUrl(chainId: number, txHash: string): string {
  const explorers: Record<number, string> = {
    1: "https://etherscan.io/tx/",
    11155111: "https://sepolia.etherscan.io/tx/",
    17000: "https://hoodi.etherscan.io/tx/", // Hoodi testnet
    137: "https://polygonscan.com/tx/",
    42161: "https://arbiscan.io/tx/",
    10: "https://optimistic.etherscan.io/tx/",
    8453: "https://basescan.org/tx/",
  };
  
  return (explorers[chainId] || "https://etherscan.io/tx/") + txHash;
}

export default function EventFeed({ events, isLive = true }: EventFeedProps) {
  const [paused, setPaused] = useState(false);
  const [selectedSeverities, setSelectedSeverities] = useState<Set<string>>(new Set());

  // Filter events by selected severities
  const filteredEvents = selectedSeverities.size > 0
    ? events.filter((e) => selectedSeverities.has(e.severity))
    : events;

  const toggleSeverity = (severity: string) => {
    const newSet = new Set(selectedSeverities);
    if (newSet.has(severity)) {
      newSet.delete(severity);
    } else {
      newSet.add(severity);
    }
    setSelectedSeverities(newSet);
  };

  const clearFilters = () => setSelectedSeverities(new Set());

  return (
    <div className="bg-card border border-card-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-card-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-foreground">Live Event Feed</h3>
          {isLive && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-3 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-chart-3"></span>
              </span>
              Live
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              data-testid="button-filter"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {selectedSeverities.size > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                  {selectedSeverities.size}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by Severity</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={selectedSeverities.has("critical")}
              onCheckedChange={() => toggleSeverity("critical")}
            >
              Critical
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={selectedSeverities.has("high")}
              onCheckedChange={() => toggleSeverity("high")}
            >
              High
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={selectedSeverities.has("medium")}
              onCheckedChange={() => toggleSeverity("medium")}
            >
              Medium
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={selectedSeverities.has("info")}
              onCheckedChange={() => toggleSeverity("info")}
            >
              Info
            </DropdownMenuCheckboxItem>
            {selectedSeverities.size > 0 && (
              <>
                <DropdownMenuSeparator />
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-xs"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        className="overflow-y-auto max-h-[500px]"
        aria-live="polite"
        aria-label="Live trap events"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <AnimatePresence initial={false}>
          {filteredEvents.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              className="p-4 border-b border-border/50 dark:border-border last:border-b-0 hover-elevate"
              data-testid={`event-${event.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusPill label={event.severity} severity={event.severity} />
                    <span className="text-xs text-muted-foreground">{event.chain}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{event.type}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {event.contract}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground mb-2">{event.timestamp}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    data-testid={`button-view-${event.id}`}
                    asChild
                  >
                    <a
                      href={getExplorerUrl(event.chainId || 17000, event.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
