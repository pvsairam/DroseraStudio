import CounterCard from "../CounterCard";
import { Activity, Zap, Shield, Clock } from "lucide-react";

export default function CounterCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-background">
      <CounterCard
        title="Total Traps"
        value="1,247"
        change="+12.5%"
        changeType="positive"
        icon={Shield}
        trend={[40, 60, 45, 80, 90, 70, 85]}
      />
      <CounterCard
        title="Active Chains"
        value="8"
        change="No change"
        changeType="neutral"
        icon={Activity}
      />
      <CounterCard
        title="Triggered Today"
        value="34"
        change="+8 from yesterday"
        changeType="positive"
        icon={Zap}
        trend={[30, 50, 40, 70, 60, 80, 90]}
      />
      <CounterCard
        title="Avg Response Time"
        value="2.3s"
        change="-0.5s improvement"
        changeType="positive"
        icon={Clock}
      />
    </div>
  );
}
