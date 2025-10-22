import DashboardHeader from "../DashboardHeader";

export default function DashboardHeaderExample() {
  return (
    <div className="bg-background min-h-screen">
      <DashboardHeader onMenuClick={() => console.log("Menu clicked")} />
    </div>
  );
}
