import {
  CalendarRange,
  FileText,
  FolderKanban,
  LayoutDashboard,
  MoreHorizontal,
  Receipt,
  Settings,
  Timer,
  Users,
  Wallet,
  HelpCircle,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type MobileTab = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  section?: string;
  action?: "more";
};

export type MoreRoute = {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: "signout";
  group: number;
};

export const MOBILE_TABS: MobileTab[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", section: "home" },
  { id: "projects",  label: "Projects",  icon: FolderKanban,    href: "/projects",  section: "work" },
  { id: "clients",   label: "Clients",   icon: Users,           href: "/clients",   section: "clients" },
  { id: "finance",   label: "Finance",   icon: Wallet,          href: "/finance",   section: "money" },
  { id: "more",      label: "More",      icon: MoreHorizontal,  action: "more" },
];

export const MORE_ROUTES: MoreRoute[] = [
  { id: "documents", label: "Documents", icon: FileText,      href: "/documents",  group: 0 },
  { id: "marketing", label: "Marketing", icon: CalendarRange, href: "/marketing",  group: 0 },
  { id: "expenses",  label: "Expenses",  icon: Receipt,       href: "/expenses",   group: 0 },
  { id: "time",      label: "Time",      icon: Timer,         href: "/time",       group: 0 },
  { id: "tasks",     label: "Tasks",     icon: FolderKanban,  href: "/tasks",      group: 0 },
  { id: "settings",  label: "Settings",  icon: Settings,      href: "/settings",   group: 1 },
  { id: "support",   label: "Support",   icon: HelpCircle,    href: "/support",    group: 1 },
  { id: "signout",   label: "Sign out",  icon: LogOut,        action: "signout",   group: 2 },
];
