import TimeseriesChart from "../TimeseriesChart";

const mockData = {
  time: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"],
  series: [
    {
      name: "Critical",
      data: [12, 18, 24, 20, 28, 22, 26],
      color: "hsl(var(--chart-5))",
    },
    {
      name: "High",
      data: [45, 52, 48, 56, 62, 58, 64],
      color: "hsl(var(--chart-2))",
    },
    {
      name: "Medium",
      data: [68, 72, 78, 74, 82, 76, 80],
      color: "hsl(var(--chart-4))",
    },
    {
      name: "Low",
      data: [32, 38, 42, 36, 44, 40, 46],
      color: "hsl(var(--chart-3))",
    },
  ],
};

export default function TimeseriesChartExample() {
  return (
    <div className="p-4 bg-background">
      <TimeseriesChart title="Trap Events by Severity" data={mockData} />
    </div>
  );
}
