import {
  BarChart3,
  Briefcase,
  Clock,
  DollarSign,
  FileText,
  LayoutDashboard,
  ListTodo,
  Receipt,
  Settings,
  Users,
} from "lucide-react";

export type CommandPaletteNavItem = {
  id: string;
  label: string;
  sub?: string;
  icon: React.ElementType;
  href?: string;
  isAI?: boolean;
};

export const COMMAND_PALETTE_SUGGESTED: CommandPaletteNavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "tasks", label: "Tasks", icon: ListTodo, href: "/tasks" },
  { id: "finance", label: "Finance", icon: BarChart3, href: "/finance" },
];

export const COMMAND_PALETTE_GO_TO: CommandPaletteNavItem[] = [
  { id: "clients", label: "Clients", icon: Users, href: "/clients" },
  { id: "projects", label: "Projects", icon: Briefcase, href: "/projects" },
  { id: "documents", label: "Documents", icon: FileText, href: "/documents" },
  { id: "expenses", label: "Expenses", icon: Receipt, href: "/expenses" },
  { id: "time", label: "Time", icon: Clock, href: "/time" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

export const COMMAND_PALETTE_CREATE: CommandPaletteNavItem[] = [
  {
    id: "new-invoice",
    label: "New invoice",
    icon: DollarSign,
    href: "/documents/new?type=invoice",
  },
  {
    id: "new-project",
    label: "New project",
    icon: Briefcase,
    href: "/projects/new",
  },
  { id: "new-client", label: "New client", icon: Users, href: "/clients/new" },
  { id: "new-expense", label: "New expense", icon: Receipt, href: "/expenses" },
];
