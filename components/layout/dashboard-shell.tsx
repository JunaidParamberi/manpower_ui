"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { CommandPalette } from "@/components/layout/command-palette";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { MoreSheet } from "@/components/layout/more-sheet";
import { AppSidebar } from "@/components/layout/sidebar";
import { ShellResizeHandle } from "@/components/layout/shell-resize-handle";
import { ShellContentInner } from "@/components/layout/shell-content-inner";
import { LegalAcceptanceGate } from "@/components/features/settings/legal/legal-acceptance-gate";
import { AnonymousConsentSync } from "@/components/features/settings/legal/anonymous-consent-sync";
import { KraftLauncher } from "@/components/features/ai-panel/kraft-launcher";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { AiPanelProvider, useAiPanel } from "@/lib/ai-panel/context";
import { AgentActivityProvider } from "@/lib/ai-panel/agent-activity-context";
import {
  SIDEBAR_WIDTH_MAX,
  SIDEBAR_WIDTH_MIN,
  ShellLayoutProvider,
  useShellLayout,
} from "@/lib/layout/shell-layout-context";
import { shellTracks } from "@/lib/layout/shell-tracks";
import { PlanUsageProvider, usePlanUsage } from "@/lib/plan-usage/context";
import { PinnedItemsProvider } from "@/lib/pinned/context";
import type { PlanUsage } from "@/lib/plan-usage/helpers";
import type { PinnedItem } from "@/lib/pinned/queries";
import type { NavLayout } from "@/lib/layout/nav-registry";
import type { NotificationRow } from "@/types";

type DashboardShellProps = {
  children: React.ReactNode;
  userEmail: string | null;
  userName: string | null;
  userInitials: string;
  planUsage: PlanUsage;
  notifications: NotificationRow[];
  unreadCount: number;
  openTaskCount: number;
  pinnedItems?: PinnedItem[];
  navLayout?: NavLayout;
  sidebarDefaultOpen?: boolean;
  sidebarDefaultWidth?: number;
  aiDefaultWidth?: number;
  needsLegalAcceptance?: boolean;
};

type ShellInnerProps = {
  children: React.ReactNode;
  sidebarProps: React.ComponentProps<typeof AppSidebar>;
  notifications: NotificationRow[];
  unreadCount: number;
  userEmail: string | null;
  userName: string | null;
  userInitials: string;
  commandOpen: boolean;
  setCommandOpen: Dispatch<SetStateAction<boolean>>;
  pinnedItems: PinnedItem[];
};

function ShellInner({
  children,
  notifications,
  unreadCount,
  sidebarProps,
  userEmail,
  userName,
  userInitials,
  commandOpen,
  setCommandOpen,
  pinnedItems,
}: ShellInnerProps) {
  const pathname = usePathname();
  const planUsage = usePlanUsage();
  const { open } = useSidebar();
  const { toggle: toggleAiPanel, isOpen: aiOpen, docked: aiDocked } = useAiPanel();
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    sidebarWidth,
    aiWidth,
    setSidebarWidth,
    resetSidebarWidth,
    isResizing,
    setIsResizing,
  } = useShellLayout();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((v) => !v);
      } else if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleAiPanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Docked Kraft takes a real grid track so it pushes the page instead of
  // covering it. The island floats, so it takes none.
  const tracks = shellTracks({
    sidebarOpen: open,
    sidebarWidth,
    kraftDockedWidth: !isMobile && aiOpen && aiDocked ? aiWidth : 0,
  });

  return (
    <>
      <div
        // Desktop: the frame behind the panels. Mobile keeps the flat canvas
        // (globals.css switches .shell-grid to display:block there).
        className="shell-grid bg-[var(--bg-canvas)] md:bg-[var(--frame)] md:p-2"
        // Stays inline: the column track sizes are live state (drag-resizable
        // sidebar and Kraft widths), and the transition is suppressed
        // mid-drag. `--kraft-left` lets Kraft's island and bar centre on the
        // page panel rather than the whole window.
        style={{
          display: "grid",
          gridTemplateColumns: tracks.columns,
          ...({ "--kraft-left": `${tracks.pageLeft}px` } as React.CSSProperties),
          height: "100dvh",
          overflow: "hidden",
          transition: isResizing ? "none" : "grid-template-columns 200ms ease",
        }}
      >
        <AppSidebar className="desktop-only" {...sidebarProps} />

        {!isMobile && open ? (
          <ShellResizeHandle
            edge="left"
            width={sidebarWidth}
            min={SIDEBAR_WIDTH_MIN}
            max={SIDEBAR_WIDTH_MAX}
            onResize={setSidebarWidth}
            onReset={resetSidebarWidth}
            onResizeStart={() => setIsResizing(true)}
            onResizeEnd={() => setIsResizing(false)}
            label="Resize sidebar"
            className="w-2"
          />
        ) : (
          <div />
        )}

        <div
          className="shell-main flex min-w-0 flex-col overflow-hidden md:rounded-[var(--radius-panel)] md:border md:border-border md:bg-[var(--panel)] md:shadow-[var(--shadow-xs)]"
        >
          <AppHeader
            notifications={notifications}
            unreadCount={unreadCount}
            onOpenSearch={() => setCommandOpen(true)}
            userName={userName}
            userEmail={userEmail}
            userInitials={userInitials}
            planUsage={planUsage}
          />
          <div
            ref={scrollRef}
            // Full-height pages (split views) fill the panel exactly and scroll
            // their own panes, so on desktop the shell neither pads nor scrolls.
            className="shell-scroll @container/shell flex-1 overflow-y-auto overscroll-contain [container-type:inline-size] md:pb-20 lg:has-[[data-page-fullbleed]]:overflow-hidden lg:has-[[data-page-fullbleed]]:pb-0"
          >
            {/* The page frame is rendered here, inside the client shell, so
                the only thing crossing the server→client boundary is the
                page itself. Passed from the layout as RSC children, the
                frame could stream in as a lazy client reference and hydrate
                as a Suspense placeholder on one side and a div on the other. */}
            <ShellContentInner>{children}</ShellContentInner>
          </div>
        </div>

        {/* Docked Kraft's track: the panel itself is fixed over it, so it
            stays one mounted element whichever layout it is in. */}
        <div aria-hidden className="max-md:hidden" />

        <KraftLauncher pageLeft={isMobile ? 0 : tracks.pageLeft} />
      </div>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        pinnedItems={pinnedItems}
      />
    </>
  );
}

export function DashboardShell({
  children,
  userEmail,
  userName,
  userInitials,
  planUsage,
  notifications,
  unreadCount,
  openTaskCount,
  pinnedItems = [],
  navLayout,
  sidebarDefaultOpen = true,
  sidebarDefaultWidth,
  aiDefaultWidth,
  needsLegalAcceptance = false,
}: DashboardShellProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const sidebarProps: React.ComponentProps<typeof AppSidebar> = {
    unreadCount,
    openTaskCount,
    pinnedItems,
    navLayout,
    onOpenSearch: () => setCommandOpen(true),
  };

  return (
    <PinnedItemsProvider pinnedItems={pinnedItems}>
    <PlanUsageProvider value={planUsage}>
      <ShellLayoutProvider defaultSidebarWidth={sidebarDefaultWidth} defaultAiWidth={aiDefaultWidth}>
      <AgentActivityProvider>
      <AiPanelProvider>
        <AnonymousConsentSync />
        <LegalAcceptanceGate needsAcceptance={needsLegalAcceptance} />
        <SidebarProvider defaultOpen={sidebarDefaultOpen} className="!block !min-h-0">
          <ShellInner
            sidebarProps={sidebarProps}
            notifications={notifications}
            unreadCount={unreadCount}
            userEmail={userEmail}
            userName={userName}
            userInitials={userInitials}
            commandOpen={commandOpen}
            setCommandOpen={setCommandOpen}
            pinnedItems={pinnedItems}
          >
            {children}
          </ShellInner>
        </SidebarProvider>

        <MobileTabBar className="mobile-only" onOpenMore={() => setMoreOpen(true)} />

        <MoreSheet
          open={moreOpen}
          onOpenChange={setMoreOpen}
          userEmail={userEmail}
          userName={userName}
          userInitials={userInitials}
          planUsage={planUsage}
          pinnedItems={pinnedItems}
        />

      </AiPanelProvider>
      </AgentActivityProvider>
      </ShellLayoutProvider>
    </PlanUsageProvider>
    </PinnedItemsProvider>
  );
}
