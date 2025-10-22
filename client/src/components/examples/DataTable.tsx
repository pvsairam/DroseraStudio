import DataTable from "../DataTable";

const columns = [
  { key: "trap", label: "Trap Type", sortable: true },
  { key: "chain", label: "Chain", sortable: true },
  { key: "contract", label: "Contract", sortable: false },
  { key: "status", label: "Status", sortable: true },
  { key: "lastTrigger", label: "Last Trigger", sortable: true },
];

const mockData = [
  {
    trap: "Liquidity Monitor",
    chain: "Ethereum",
    contract: "0x1234...5678",
    status: "active",
    lastTrigger: "2 hours ago",
  },
  {
    trap: "Security Vault",
    chain: "Polygon",
    contract: "0x8765...4321",
    status: "triggered",
    lastTrigger: "15 min ago",
  },
  {
    trap: "Governance Check",
    chain: "Arbitrum",
    contract: "0x9999...1111",
    status: "dormant",
    lastTrigger: "3 days ago",
  },
  {
    trap: "Oracle Watcher",
    chain: "Optimism",
    contract: "0x2222...3333",
    status: "active",
    lastTrigger: "1 hour ago",
  },
];

export default function DataTableExample() {
  return (
    <div className="p-4 bg-background">
      <DataTable columns={columns} data={mockData} title="Active Traps" />
    </div>
  );
}
