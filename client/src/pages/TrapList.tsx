import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Shield, ExternalLink, CheckCircle2, AlertTriangle, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { TrapStatus } from "@shared/schema";

interface TrapStatusWithType extends TrapStatus {
  trapTypeName?: string;
}

const statusConfig = {
  active: { icon: CheckCircle2, color: "text-chart-3", bg: "bg-chart-3/10" },
  triggered: { icon: AlertTriangle, color: "text-chart-5", bg: "bg-chart-5/10" },
  dormant: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
};

const chainNames: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  137: "Polygon",
  42161: "Arbitrum",
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

export default function TrapList() {
  const { data: trapStatuses = [], isLoading } = useQuery<TrapStatusWithType[]>({
    queryKey: ["/api/trap-status"],
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-40 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
          Configured Traps
        </h1>
        <p className="text-muted-foreground">
          Monitoring configurations for security traps across multiple chains
        </p>
      </div>

      <div className="grid gap-4">
        {trapStatuses.map((trap, index) => {
          const statusKey = trap.status as keyof typeof statusConfig;
          const StatusIcon = statusConfig[statusKey]?.icon || Circle;
          const statusColor = statusConfig[statusKey]?.color || "text-muted-foreground";
          const statusBg = statusConfig[statusKey]?.bg || "bg-muted";

          return (
            <motion.div
              key={trap.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover-elevate" data-testid={`card-trap-${trap.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${statusBg}`}>
                      <Shield className={`w-6 h-6 ${statusColor}`} />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1" data-testid={`text-trap-type-${trap.id}`}>
                          {trap.trapTypeName || "Unknown Trap Type"}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-sm font-medium ${statusColor}`}>
                            <StatusIcon className="w-4 h-4" />
                            {trap.status.charAt(0).toUpperCase() + trap.status.slice(1)}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {chainNames[trap.chainId] || `Chain ${trap.chainId}`}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Contract:</span>{" "}
                          <code className="text-foreground font-mono text-xs bg-muted px-2 py-1 rounded">
                            {trap.contractAddress.slice(0, 10)}...{trap.contractAddress.slice(-8)}
                          </code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Triggers:</span>{" "}
                          <span className="text-foreground font-semibold">{trap.triggerCount || 0}</span>
                        </div>
                      </div>

                      {trap.lastTriggered && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Last Triggered:</span>{" "}
                          <span className="text-foreground">
                            {new Date(trap.lastTriggered).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <a
                    href={`${explorerUrls[trap.chainId] || 'https://etherscan.io'}/address/${trap.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    data-testid={`link-explorer-${trap.id}`}
                  >
                    <ExternalLink className="w-5 h-5 text-muted-foreground" />
                  </a>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {trapStatuses.length === 0 && (
        <Card className="p-12 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Traps Configured</h3>
          <p className="text-muted-foreground">
            Configure trap monitoring rules to start tracking security events
          </p>
        </Card>
      )}
    </div>
  );
}
