import EmptyState from "../EmptyState";
import { Inbox } from "lucide-react";

export default function EmptyStateExample() {
  return (
    <div className="p-4 bg-background min-h-screen flex items-center justify-center">
      <EmptyState
        icon={Inbox}
        title="No events yet"
        description="Start monitoring on-chain traps to see events appear here in real-time."
        actionLabel="Configure Data Source"
        onAction={() => console.log("Configure clicked")}
      />
    </div>
  );
}
