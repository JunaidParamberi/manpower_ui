"use client";

import { ChevronRight, PanelLeft, PanelLeftClose, Search } from "lucide-react";
import { usePathname } from "next/navigation";

import { NotificationBell } from "@/components/features/notifications/notification-bell";
import { AccountMenu } from "@/components/layout/account-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { getRouteBreadcrumb } from "@/config/nav";
import type { PlanUsage } from "@/lib/plan-usage/helpers";
import type { NotificationRow } from "@/types";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  notifications: NotificationRow[];
  unreadCount: number;
  onOpenSearch: () => void;
  userName: string | null;
  userEmail: string | null;
  userInitials: string;
  planUsage: PlanUsage;
};

export function AppHeader({
  notifications,
  unreadCount,
  onOpenSearch,
  userName,
  userEmail,
  userInitials,
  planUsage,
}: AppHeaderProps) {
  const pathname = usePathname();
  const { open, toggleSidebar } = useSidebar();
  const [section, page] = getRouteBreadcrumb(pathname);

  const SidebarIcon = open ? PanelLeftClose : PanelLeft;

  return (
    <header
      className={cn(
        "shell-topbar flex h-[var(--topbar-h)] shrink-0 items-center justify-between",
        // One divider under the app bar on every page and screen size.
        "border-b border-border bg-[var(--bg-canvas)] px-5 md:bg-transparent md:px-7",
      )}
    >
      {/* Left: sidebar toggle + breadcrumb (desktop) / page title (mobile) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          title={open ? "Collapse sidebar" : "Expand sidebar"}
          className={cn(
            // .desktop-only supplies display:flex, so no flex utility here.
            "desktop-only size-7 shrink-0 cursor-pointer items-center justify-center",
            "rounded-[6px] border-0 bg-transparent text-[var(--fg-3)]",
            "transition-colors duration-[var(--dur-fast)]",
            "hover:bg-[var(--bg-subtle)] hover:text-foreground",
          )}
        >
          <SidebarIcon size={16} strokeWidth={1.6} />
        </button>
        {/* Breadcrumb — desktop only */}
        <div
          className="desktop-only items-center gap-1.5 text-body text-[var(--fg-2)]"
        >
          {section && (
            <>
              <span>{section}</span>
              <ChevronRight size={12} strokeWidth={1.6} className="text-[var(--fg-3)]" />
            </>
          )}
          {page && (
            <strong className="font-medium text-foreground">{page}</strong>
          )}
        </div>

        {/* Page title — mobile only */}
        <span
          className={cn(
            "mobile-only items-center font-heading text-[16px] font-semibold",
            "tracking-[-0.014em] text-foreground",
          )}
        >
          {page || section || "Manpower"}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search — same pill chip as before, just wider on desktop */}
        <button
          type="button"
          onClick={onOpenSearch}
          aria-label="Search"
          className={cn(
            "flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-md md:min-w-[160px] xl:min-w-[240px]",
            "border border-transparent bg-[var(--bg-subtle)] px-2.5",
            "font-sans text-body text-[var(--fg-3)]",
            "transition-[background-color,border-color] duration-[var(--dur-fast)]",
            "hover:border-border hover:text-[var(--fg-2)]",
            "[-webkit-tap-highlight-color:transparent]",
          )}
        >
          <Search size={13} strokeWidth={1.6} className="shrink-0" />
          <span
            className="desktop-only flex-1 items-center"
          >
            Search
          </span>
          <kbd
            className={cn(
              "desktop-only shrink-0 rounded-xs border border-border bg-[var(--bg-surface)]",
              "px-[5px] py-px font-sans text-label text-[var(--fg-3)]",
            )}
          >
            ⌘K
          </kbd>
        </button>
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        {/* Account menu (theme lives inside it) — desktop only; mobile gets
            the same options in the More sheet. */}
        <span className="desktop-only ms-1 items-center">
          <AccountMenu
            userName={userName}
            userEmail={userEmail}
            userInitials={userInitials}
            planUsage={planUsage}
          />
        </span>
      </div>
    </header>
  );
}
