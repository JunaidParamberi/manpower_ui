import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Briefcase,
  Building2,
  FileCheck2,
  FileText,
  FolderKanban,
  HardHat,
  Home,
  Layers,
  LayoutDashboard,
  ListChecks,
  MessageSquareQuote,
  Receipt,
  ReceiptText,
  Sliders,
  Timer,
  Truck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export type RailSection = {
  id: string;
  icon: LucideIcon;
  label: string;
};

export type PaneItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
};

export type PaneNavSection = {
  label?: string;
  items: PaneItem[];
};

export type PaneConfig = {
  title: string;
  sections: PaneNavSection[];
};

export const RAIL_SECTIONS: RailSection[] = [
  { id: "home", icon: Home, label: "Home" },
  { id: "work", icon: Briefcase, label: "Work" },
  { id: "money", icon: Wallet, label: "Money" },
  { id: "design", icon: Layers, label: "Design system" },
];

export const PANE_CONFIGS: Record<string, PaneConfig> = {
  home: {
    title: "Home",
    sections: [
      {
        items: [
          { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
          { id: "tasks",     icon: ListChecks,      label: "Tasks",     href: "/tasks" },
          { id: "time",      icon: Timer,           label: "Time",      href: "/time" },
        ],
      },
    ],
  },
  work: {
    title: "Work",
    sections: [
      {
        label: "CRM",
        items: [
          { id: "clients",   icon: Users,       label: "Clients",       href: "/clients" },
          { id: "projects",  icon: FolderKanban, label: "Projects",     href: "/projects" },
        ],
      },
      {
        label: "Manpower",
        items: [
          { id: "workers",         icon: HardHat,   label: "Workers",         href: "/workers" },
          { id: "suppliers",       icon: Truck,     label: "Suppliers",       href: "/suppliers" },
          { id: "project-clients", icon: Building2, label: "Project clients", href: "/project-clients" },
        ],
      },
      {
        label: "Documents",
        items: [
          { id: "documents",  icon: FileText,          label: "All documents", href: "/documents" },
          { id: "invoices",   icon: ReceiptText,        label: "Invoices",      href: "/documents/invoices" },
          { id: "quotes",     icon: MessageSquareQuote, label: "Quotes",        href: "/documents/quotes" },
          { id: "proposals",  icon: FileCheck2,         label: "Proposals",     href: "/documents/proposals" },
          { id: "receipts",   icon: BadgeCheck,         label: "Receipts",      href: "/documents/receipts" },
          { id: "purchase-orders", icon: FileText,      label: "Purchase orders", href: "/documents/purchase-orders" },
        ],
      },
    ],
  },
  money: {
    title: "Money",
    sections: [
      {
        items: [
          { id: "finance",  icon: TrendingUp, label: "Finance",  href: "/finance" },
          { id: "expenses", icon: Receipt,    label: "Expenses", href: "/expenses" },
        ],
      },
    ],
  },
  design: {
    title: "Design system",
    sections: [
      {
        items: [
          { id: "ds-overview", icon: Layers,  label: "Overview",   href: "/design-system" },
          { id: "ds-comp",     icon: Sliders, label: "Components", href: "/design-system" },
        ],
      },
    ],
  },
};

export const ROUTE_TO_SECTION: Record<string, string> = {
  "/dashboard": "home",
  "/tasks":     "home",
  "/time":      "home",
  "/clients":   "work",
  "/projects":  "work",
  "/workers":         "work",
  "/suppliers":       "work",
  "/project-clients": "work",
  "/documents": "work",
  "/finance":   "money",
  "/expenses":  "money",
  "/settings":  "home",
  "/support":   "home",
  "/design-system": "design",
};

export const ROUTE_LABELS: Record<string, [string, string]> = {
  "/dashboard":        ["Home",     "Dashboard"],
  "/tasks":            ["Home",     "Tasks"],
  "/time":             ["Home",     "Time"],
  "/clients":          ["Work",     "Clients"],
  "/projects":         ["Work",     "Projects"],
  "/workers":          ["Work",     "Workers"],
  "/suppliers":        ["Work",     "Suppliers"],
  "/project-clients":  ["Work",     "Project clients"],
  "/documents":        ["Work",     "Documents"],
  "/finance":          ["Money",    "Finance"],
  "/expenses":         ["Money",    "Expenses"],
  "/settings":         ["Settings", "General"],
  "/settings/account": ["Settings", "Account"],
  "/settings/legal":   ["Settings", "Legal & privacy"],
  "/settings/notifications": ["Settings", "Notifications"],
  "/settings/brand":   ["Settings", "Brand kit"],
  "/settings/billing": ["Settings", "Billing"],
  "/settings/api":     ["Settings", "API & integrations"],
  "/settings/profile": ["Settings", "Profile"],
  "/support":          ["Help",     "Support"],
  "/design-system":    ["Design system", "Overview"],
};

export function getRouteSection(pathname: string): string {
  if (ROUTE_TO_SECTION[pathname]) return ROUTE_TO_SECTION[pathname];
  for (const [route, section] of Object.entries(ROUTE_TO_SECTION)) {
    if (pathname.startsWith(`${route}/`)) return section;
  }
  return "home";
}

export function getRouteBreadcrumb(pathname: string): [string, string] {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  for (const [route, label] of Object.entries(ROUTE_LABELS)) {
    if (pathname.startsWith(`${route}/`)) return label;
  }
  return ["", ""];
}
