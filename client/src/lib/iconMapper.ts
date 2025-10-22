import { 
  LayoutDashboard, 
  Search, 
  Bell, 
  BookOpen, 
  Settings, 
  Globe,
  Shield,
  TrendingUp,
  Activity,
  AlertCircle,
  Database,
  FileText,
  Users,
  BarChart,
  Terminal,
  type LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Search,
  Bell,
  BookOpen,
  Settings,
  Globe,
  Shield,
  TrendingUp,
  Activity,
  AlertCircle,
  Database,
  FileText,
  Users,
  BarChart,
  Terminal,
};

export function getIconComponent(iconName: string): LucideIcon {
  if (!iconMap[iconName]) {
    console.warn(`Icon "${iconName}" not found in iconMap, using Settings as fallback`);
    return Settings;
  }
  return iconMap[iconName];
}
