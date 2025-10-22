import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ExternalLink, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TrapEvent, Protocol } from "@shared/schema";

const chainNames: Record<number, string> = {
  1: "Ethereum",
  137: "Polygon",
  42161: "Arbitrum",
  10: "Optimism",
  8453: "Base",
  17000: "Hoodi Testnet",
};

const explorerUrls: Record<number, string> = {
  1: "https://etherscan.io",
  10: "https://optimistic.etherscan.io",
  137: "https://polygonscan.com",
  42161: "https://arbiscan.io",
  8453: "https://basescan.org",
  17000: "https://hoodi.etherscan.io",
};

const severityColors: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-blue-500 text-white",
};

export default function Explorer() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChain, setSelectedChain] = useState<string>("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");

  const { data: protocols = [] } = useQuery<Protocol[]>({
    queryKey: ["/api/protocols"],
  });

  const { data: events = [], isLoading } = useQuery<TrapEvent[]>({
    queryKey: ["/api/trap-events"],
  });

  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      event.txHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.contractAddress.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesChain = selectedChain === "all" || event.chainId === parseInt(selectedChain);
    const matchesSeverity = selectedSeverity === "all" || event.severity === selectedSeverity;

    return matchesSearch && matchesChain && matchesSeverity;
  });

  // Calculate event counts per transaction
  const txEventCounts = new Map<string, number>();
  const txEventIndices = new Map<string, Map<string, number>>();
  
  events.forEach((event) => {
    txEventCounts.set(event.txHash, (txEventCounts.get(event.txHash) || 0) + 1);
  });
  
  events.forEach((event) => {
    if (!txEventIndices.has(event.txHash)) {
      txEventIndices.set(event.txHash, new Map());
    }
    const currentCount = txEventIndices.get(event.txHash)!.size + 1;
    txEventIndices.get(event.txHash)!.set(event.id, currentCount);
  });

  const uniqueChains = Array.from(new Set(events.map((e) => e.chainId)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
      data-testid="page-explorer"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Event Explorer</h1>
          <p className="text-muted-foreground mt-1">
            Browse and filter trap events across all monitored chains
          </p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by transaction hash or contract address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select value={selectedChain} onValueChange={setSelectedChain}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-chain">
              <SelectValue placeholder="All Chains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Chains</SelectItem>
              {uniqueChains.map((chainId) => (
                <SelectItem key={chainId} value={chainId.toString()}>
                  {chainNames[chainId] || `Chain ${chainId}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-severity">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-muted-foreground">Loading events...</div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>
              Showing {filteredEvents.length} of {events.length} events
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredEvents.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No events found matching your filters</p>
              </Card>
            ) : (
              filteredEvents.map((event) => (
                <Card key={event.id} className="p-4 hover-elevate" data-testid={`card-event-${event.id}`}>
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={severityColors[event.severity]} data-testid="badge-severity">
                          {event.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" data-testid="badge-chain">
                          {chainNames[event.chainId] || `Chain ${event.chainId}`}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Block #{event.blockNumber}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-muted-foreground">Transaction:</span>
                          <a
                            href={`${explorerUrls[event.chainId] || 'https://etherscan.io'}/tx/${event.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                            data-testid="link-transaction"
                          >
                            {event.txHash.slice(0, 10)}...{event.txHash.slice(-8)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {txEventCounts.get(event.txHash)! > 1 && (
                            <Badge variant="secondary" className="text-xs" data-testid="badge-event-count">
                              Event {txEventIndices.get(event.txHash)?.get(event.id)} of {txEventCounts.get(event.txHash)}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Contract:</span>
                          <a
                            href={`${explorerUrls[event.chainId] || 'https://etherscan.io'}/address/${event.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                            data-testid="link-contract"
                          >
                            {event.contractAddress.slice(0, 10)}...{event.contractAddress.slice(-8)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {event.trapTypeId && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Trap Type:</span>
                            <span className="text-sm text-foreground">{event.trapTypeId.slice(0, 8)}...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.blockTimestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {event.parsedFields && typeof event.parsedFields === 'object' && Object.keys(event.parsedFields as Record<string, unknown>).length > 0 ? (
                    <div className="mt-3 pt-3 border-t border-card-border">
                      <div className="text-sm text-muted-foreground mb-1">Event Data:</div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(event.parsedFields, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
