import { cn } from "@/lib/utils";

type SeverityLevel = "critical" | "high" | "medium" | "low" | "info";
type StatusType = "active" | "dormant" | "triggered" | "pending";

interface StatusPillProps {
  label: string;
  severity?: SeverityLevel;
  status?: StatusType;
  className?: string;
}

const severityColors: Record<SeverityLevel, string> = {
  critical: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  high: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  medium: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  low: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  info: "bg-chart-1/10 text-chart-1 border-chart-1/20",
};

const statusColors: Record<StatusType, string> = {
  active: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  dormant: "bg-muted/50 text-muted-foreground border-border",
  triggered: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  pending: "bg-chart-4/10 text-chart-4 border-chart-4/20",
};

export default function StatusPill({
  label,
  severity,
  status,
  className,
}: StatusPillProps) {
  const colorClass = severity ? severityColors[severity] : status ? statusColors[status] : "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap",
        colorClass,
        className
      )}
      data-testid="status-pill"
    >
      {label}
    </span>
  );
}
