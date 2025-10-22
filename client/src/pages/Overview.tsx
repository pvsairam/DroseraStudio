import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import CounterCard from "@/components/CounterCard";
import TimeseriesChart from "@/components/TimeseriesChart";
import DonutChart from "@/components/DonutChart";
import EventFeed from "@/components/EventFeed";
import DataTable from "@/components/DataTable";
import { Activity, Zap, Shield, Clock } from "lucide-react";
import type { TrapEvent, TrapStatus } from "@shared/schema";

const chainNames: Record<number, string> = {
  1: "Ethereum",
  10: "Optimism",
  137: "Polygon",
  42161: "Arbitrum",
  8453: "Base",
};

const severityColors: Record<string, string> = {
  critical: "#EF4444", // Red - for critical issues
  high: "#FF8A00", // Orange - for high priority
  medium: "#FFBB28", // Yellow - for medium priority
  info: "#0088FE", // Blue - for informational events
};

function formatTimeAgo(timestamp: Date | string): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function shortenTxHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-3)}`;
}

interface DashboardStats {
  totalTraps: number;
  activeChains: number;
  triggeredToday: number;
  triggeredYesterday: number;
  trapsByType: Record<string, number>;
  last7DaysEvents: number[];
}

export default function Overview() {
  const [, setLocation] = useLocation();
  const [wsEvents, setWsEvents] = useState<TrapEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch trap events (reduced interval since WebSocket provides real-time updates)
  const { data: trapEvents = [], isLoading: eventsLoading } = useQuery<TrapEvent[]>({
    queryKey: ["/api/trap-events"],
    refetchInterval: 30000, // 30 seconds - WebSocket is primary, this is backup
  });

  // Fetch trap statuses
  const { data: trapStatuses = [] } = useQuery<TrapStatus[]>({
    queryKey: ["/api/trap-status"],
    refetchInterval: 15000,
  });

  // Combine API events with WebSocket events
  const allEvents = [...wsEvents, ...trapEvents].slice(0, 100);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        console.log("📥 WebSocket message received:", event.data);
        const message = JSON.parse(event.data);
        console.log("📦 Parsed message:", message);
        if (message.type === "trap_event" && message.data) {
          console.log("✅ Adding trap event to live feed:", message.data);
          setWsEvents((prev) => [message.data, ...prev].slice(0, 50));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, []);

  // Calculate KPIs from real dashboard stats
  const totalTraps = dashboardStats?.totalTraps || 0;
  const activeChains = dashboardStats?.activeChains || 0;
  const triggeredToday = dashboardStats?.triggeredToday || 0;
  const triggeredYesterday = dashboardStats?.triggeredYesterday || 0;
  const last7DaysTotal = dashboardStats?.last7DaysEvents?.reduce((a, b) => a + b, 0) || 0;
  
  // Calculate percentage change for triggered events
  const triggeredChangePercent = triggeredYesterday > 0 
    ? Math.round(((triggeredToday - triggeredYesterday) / triggeredYesterday) * 100)
    : null;

  const kpiData = [
    {
      title: "Total Traps",
      value: totalTraps.toString(),
      change: "Monitoring configurations",
      changeType: "neutral",
      icon: Shield,
    },
    {
      title: "Active Chains",
      value: activeChains.toString(),
      change: "Multi-chain monitoring",
      changeType: "neutral",
      icon: Activity,
    },
    {
      title: "Events Today",
      value: triggeredToday.toString(),
      change: triggeredChangePercent !== null 
        ? `${triggeredChangePercent > 0 ? '+' : ''}${triggeredChangePercent}% from yesterday`
        : "Today's trap events",
      changeType: triggeredChangePercent === null ? "neutral" : (triggeredChangePercent > 0 ? "positive" : "negative"),
      icon: Zap,
    },
    {
      title: "Total Events (7d)",
      value: last7DaysTotal.toString(),
      change: "Historical data",
      changeType: "neutral",
      icon: Clock,
    },
  ] as const;

  // Prepare timeseries data from real events - aggregate by recent hours
  const now = new Date();
  const currentHour = now.getHours();
  const hours = 7;
  
  // Initialize arrays for the last N hours
  const severityByRecentHour: Record<string, number[]> = {
    critical: Array(hours).fill(0),
    high: Array(hours).fill(0),
    medium: Array(hours).fill(0),
    info: Array(hours).fill(0),
  };

  // Count events by hour bucket (0 = oldest, 6 = most recent)
  // Use createdAt (detection time) for real-time feel instead of blockTimestamp
  allEvents.forEach((event) => {
    const eventDate = new Date(event.createdAt);
    const hoursAgo = Math.floor((now.getTime() - eventDate.getTime()) / 3600000);
    
    // Only include events from the last N hours
    if (hoursAgo < hours) {
      const bucketIndex = hours - 1 - hoursAgo;
      if (event.severity && severityByRecentHour[event.severity] && bucketIndex >= 0) {
        severityByRecentHour[event.severity][bucketIndex]++;
      }
    }
  });

  // Generate time labels for the last N hours
  const timeLabels = Array.from({ length: hours }, (_, i) => {
    const hour = (currentHour - hours + 1 + i + 24) % 24;
    return `${hour.toString().padStart(2, "0")}:00`;
  });

  const timeseriesData = {
    time: timeLabels,
    series: [
      {
        name: "Critical",
        data: severityByRecentHour.critical,
        color: severityColors.critical,
      },
      {
        name: "High",
        data: severityByRecentHour.high,
        color: severityColors.high,
      },
      {
        name: "Medium",
        data: severityByRecentHour.medium,
        color: severityColors.medium,
      },
      {
        name: "Info",
        data: severityByRecentHour.info,
        color: severityColors.info,
      },
    ],
  };

  // Use real trap type data from dashboard stats
  const trapsByType = dashboardStats?.trapsByType || {};
  const trapTypeEntries = Object.entries(trapsByType);
  
  // Create vibrant, visible colors for donut chart (works in both light and dark modes)
  const vibrantColors = [
    "#00A3FF", // Electric Blue (primary)
    "#FF8A00", // Alert Orange (secondary)
    "#10B981", // Emerald Green
    "#8B5CF6", // Purple
    "#F59E0B", // Amber
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#EF4444", // Red
  ];
  
  const donutData = trapTypeEntries.length > 0
    ? trapTypeEntries.map(([name, value], idx) => ({
        name: name.length > 20 ? name.slice(0, 17) + "..." : name,
        value,
        color: vibrantColors[idx % vibrantColors.length],
      }))
    : [
        { name: "No data", value: 1, color: "#9CA3AF" }, // Gray for empty state
      ];

  // Prepare events for EventFeed - show unique transaction hash
  const feedEvents = allEvents.slice(0, 10).map((event) => ({
    id: event.id,
    type: event.eventSignature || "trap_triggered",
    severity: event.severity as "critical" | "high" | "medium" | "info",
    chain: chainNames[event.chainId] || `Chain ${event.chainId}`,
    contract: shortenTxHash(event.txHash), // Show unique tx hash
    timestamp: formatTimeAgo(event.createdAt), // Show when event was detected for real-time feel
    txHash: event.txHash, // Pass full tx hash for Etherscan link
    chainId: event.chainId, // Pass chainId to determine explorer URL
  }));

  // Prepare table data from trap statuses with clickable contract addresses
  const tableColumns = [
    { key: "trap", label: "Trap Type", sortable: true },
    { key: "chain", label: "Chain", sortable: true },
    { key: "contract", label: "CONTRACT", sortable: false },
    { key: "status", label: "Status", sortable: true },
  ];

  // Get explorer URL for contract address
  const getContractExplorerUrl = (chainId: number, address: string): string => {
    const explorers: Record<number, string> = {
      1: "https://etherscan.io/address/",
      11155111: "https://sepolia.etherscan.io/address/",
      17000: "https://hoodi.etherscan.io/address/",
      137: "https://polygonscan.com/address/",
      42161: "https://arbiscan.io/address/",
      10: "https://optimistic.etherscan.io/address/",
      8453: "https://basescan.org/address/",
    };
    return (explorers[chainId] || "https://etherscan.io/address/") + address;
  };

  const tableData = trapStatuses.slice(0, 10).map((status) => ({
    trap: status.trapTypeId ? shortenAddress(status.trapTypeId) : "Unknown",
    chain: chainNames[status.chainId] || `Chain ${status.chainId}`,
    contract: status.contractAddress,
    contractDisplay: shortenAddress(status.contractAddress),
    contractUrl: getContractExplorerUrl(status.chainId, status.contractAddress),
    chainId: status.chainId,
    status: status.status,
  }));

  if (eventsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 space-y-6"
      data-testid="page-overview"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, i) => (
          <CounterCard 
            key={i} 
            {...kpi} 
            onClick={i === 0 ? () => setLocation('/traps') : undefined}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <TimeseriesChart title="Trap Events by Severity" data={timeseriesData} />
        </div>
        <div className="lg:col-span-2">
          <DonutChart title="Trap Types Distribution" data={donutData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <EventFeed events={feedEvents} isLive={true} />
        </div>
        <div>
          <DataTable columns={tableColumns} data={tableData} title="Status Overview" />
        </div>
      </div>
    </motion.div>
  );
}
