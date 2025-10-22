import DonutChart from "../DonutChart";

const mockData = [
  { name: "Security", value: 342, color: "hsl(var(--chart-5))" },
  { name: "Liquidity", value: 256, color: "hsl(var(--chart-1))" },
  { name: "Governance", value: 189, color: "hsl(var(--chart-2))" },
  { name: "Oracle", value: 147, color: "hsl(var(--chart-4))" },
  { name: "Other", value: 98, color: "hsl(var(--chart-3))" },
];

export default function DonutChartExample() {
  return (
    <div className="p-4 bg-background">
      <DonutChart title="Trap Types Distribution" data={mockData} />
    </div>
  );
}
