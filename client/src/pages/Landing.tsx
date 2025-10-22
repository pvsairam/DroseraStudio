import { motion } from "framer-motion";
import { Link } from "wouter";
import { Shield, Zap, Eye, ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import CounterCard from "@/components/CounterCard";
import ThemeToggle from "@/components/ThemeToggle";
import ConnectWallet from "@/components/ConnectWallet";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { useWalletAuth } from "@/hooks/useWalletAuth";

const features = [
  {
    icon: Shield,
    title: "Smart Contract Security",
    description: "Monitor trap triggers and security events across the Drosera Network in real-time.",
  },
  {
    icon: Zap,
    title: "Real-Time Monitoring",
    description: "Live streaming trap events with WebSocket support and intelligent alerting.",
  },
  {
    icon: Eye,
    title: "Multi-Chain Support",
    description: "Monitor Ethereum, Polygon, Arbitrum, Optimism, and more from a single dashboard.",
  },
];


interface DashboardStats {
  totalTraps: number;
  activeChains: number;
  triggeredToday: number;
  triggeredYesterday: number;
  trapsByType: Record<string, number>;
  last7DaysEvents: number[];
}

export default function Landing() {
  const { user, isAuthenticated } = useWalletAuth();
  
  // Fetch real dashboard statistics
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const totalTraps = stats?.totalTraps || 0;
  const triggeredToday = stats?.triggeredToday || 0;
  const activeChains = stats?.activeChains || 0;
  
  // Show admin console if authenticated and has admin role
  const isAdmin = isAuthenticated && (user?.role === 'master_admin' || user?.role === 'admin');

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="text-xl font-semibold text-foreground">Drosera Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild data-testid="link-docs">
              <a href="https://dev.drosera.io/" target="_blank" rel="noopener noreferrer">Documentation</a>
            </Button>
            <Button variant="ghost" size="icon" asChild data-testid="link-github">
              <a href="https://github.com/drosera-network" target="_blank" rel="noopener noreferrer">
                <Github className="w-5 h-5" />
              </a>
            </Button>
            <ThemeToggle />
            <ConnectWallet />
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="text-center max-w-4xl mx-auto mb-16"
        >
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Drosera Studio
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Production-grade monitoring dashboard for the Drosera Network. 
            Real-time trap event tracking, intelligent alerting, and 
            comprehensive analytics for blockchain security operators.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild data-testid="button-dashboard">
              <Link href="/overview">
                View Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            {isAdmin && (
              <Button size="lg" variant="outline" asChild data-testid="link-admin">
                <Link href="/admin">
                  Admin Console
                </Link>
              </Button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16"
        >
          <CounterCard 
            title="Live Traps" 
            value={totalTraps.toLocaleString()} 
            icon={Shield} 
          />
          <CounterCard 
            title="Events Today" 
            value={triggeredToday.toLocaleString()} 
            icon={Zap} 
          />
          <CounterCard 
            title="Active Chains" 
            value={activeChains.toString()} 
            icon={Eye} 
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 14,
                delay: 0.3 + i * 0.1,
              }}
              className="bg-card border border-card-border rounded-lg p-6 hover-elevate"
            >
              <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

      </section>

      <Footer />
    </div>
  );
}
