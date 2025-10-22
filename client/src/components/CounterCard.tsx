import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface CounterCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  trend?: number[];
  onClick?: () => void;
}

export default function CounterCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  trend,
  onClick,
}: CounterCardProps) {
  const changeColors = {
    positive: "text-chart-3",
    negative: "text-chart-5",
    neutral: "text-muted-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className={`bg-card border border-card-border rounded-lg p-6 hover-elevate ${onClick ? 'cursor-pointer active-elevate-2' : ''}`}
      onClick={onClick}
      data-testid="counter-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
            {title}
          </p>
          <p className="text-3xl font-semibold text-foreground" data-testid="counter-value">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
      {change && (
        <div className="flex items-center">
          <span className={`text-sm font-medium ${changeColors[changeType]}`} data-testid="counter-change">
            {change}
          </span>
        </div>
      )}
    </motion.div>
  );
}
