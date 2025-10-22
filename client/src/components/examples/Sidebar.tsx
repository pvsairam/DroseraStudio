import Sidebar from "../Sidebar";

export default function SidebarExample() {
  return (
    <div className="bg-background min-h-screen">
      <Sidebar isOpen={true} onClose={() => console.log("Close sidebar")} />
    </div>
  );
}
