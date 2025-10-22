import StatusPill from "../StatusPill";

export default function StatusPillExample() {
  return (
    <div className="p-8 bg-background space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Severity Levels</h3>
        <div className="flex flex-wrap gap-2">
          <StatusPill label="Critical" severity="critical" />
          <StatusPill label="High" severity="high" />
          <StatusPill label="Medium" severity="medium" />
          <StatusPill label="Low" severity="low" />
          <StatusPill label="Info" severity="info" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Status Types</h3>
        <div className="flex flex-wrap gap-2">
          <StatusPill label="Active" status="active" />
          <StatusPill label="Dormant" status="dormant" />
          <StatusPill label="Triggered" status="triggered" />
          <StatusPill label="Pending" status="pending" />
        </div>
      </div>
    </div>
  );
}
