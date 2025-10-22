import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "./lib/wagmi";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Landing from "@/pages/Landing";
import Overview from "@/pages/Overview";
import TrapList from "@/pages/TrapList";
import Explorer from "@/pages/Explorer";
import Alerts from "@/pages/Alerts";
import Runbooks from "@/pages/Runbooks";
import AdminConfig from "@/pages/AdminConfig";
import BlockchainNetworks from "@/pages/BlockchainNetworks";
import NotFound from "@/pages/not-found";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <DashboardHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/overview">
        <DashboardLayout>
          <Overview />
        </DashboardLayout>
      </Route>
      <Route path="/traps">
        <DashboardLayout>
          <TrapList />
        </DashboardLayout>
      </Route>
      <Route path="/explorer">
        <DashboardLayout>
          <Explorer />
        </DashboardLayout>
      </Route>
      <Route path="/alerts">
        <DashboardLayout>
          <Alerts />
        </DashboardLayout>
      </Route>
      <Route path="/runbooks">
        <DashboardLayout>
          <Runbooks />
        </DashboardLayout>
      </Route>
      <Route path="/admin">
        <DashboardLayout>
          <AdminConfig />
        </DashboardLayout>
      </Route>
      <Route path="/admin/networks">
        <DashboardLayout>
          <BlockchainNetworks />
        </DashboardLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
