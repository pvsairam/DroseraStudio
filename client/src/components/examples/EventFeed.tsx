import EventFeed from "../EventFeed";

const mockEvents = [
  {
    id: "1",
    type: "Liquidity Drain Detected",
    severity: "critical" as const,
    chain: "Ethereum",
    contract: "0x1234...5678",
    timestamp: "2 min ago",
    txHash: "0xabc...def",
  },
  {
    id: "2",
    type: "Governance Vote Anomaly",
    severity: "high" as const,
    chain: "Polygon",
    contract: "0x8765...4321",
    timestamp: "5 min ago",
    txHash: "0xfed...cba",
  },
  {
    id: "3",
    type: "Security Threshold Breach",
    severity: "medium" as const,
    chain: "Arbitrum",
    contract: "0x9999...1111",
    timestamp: "12 min ago",
    txHash: "0x111...999",
  },
  {
    id: "4",
    type: "Standard Event Logged",
    severity: "info" as const,
    chain: "Optimism",
    contract: "0x2222...3333",
    timestamp: "18 min ago",
    txHash: "0x333...222",
  },
];

export default function EventFeedExample() {
  return (
    <div className="p-4 bg-background">
      <EventFeed events={mockEvents} isLive={true} />
    </div>
  );
}
