"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegments } from "next/navigation";

import type { ClientOverviewRow } from "@/lib/clients/clients-overview-queries";
import { ClientsListPane } from "@/components/features/clients/overview/clients-list-pane";
import { cn } from "@/lib/utils";
import type { PlanTier } from "@/config/plans";

type ClientsShellProps = {
  clients: ClientOverviewRow[];
  defaultCurrency?: string;
  atLimit: boolean;
  planTier: PlanTier;
  clientLimit: number;
  revenueLabel: string;
  children: ReactNode;
};

/**
 * Responsive master-detail shell for the clients section. Same frame as
 * components/features/projects/projects-page.tsx: list pane 360px, a line,
 * then the detail.
 *
 * Layout contract:
 *   - The split root carries `data-page-fullbleed`, which tells the dashboard
 *     shell (shell-content-inner) to drop its max-width cap + padding so the
 *     split fills the full available width/height. No negative-margin hacks.
 *   - `lg:h-[calc(...)]` + `overflow: hidden` lets each pane own its own scroll.
 *
 * Route -> segment behaviour:
 *   /clients            segments = []        -> split, mobile shows list
 *   /clients/[id]       segments = ["<id>"]  -> split, mobile shows detail
 *   /clients/new        segments = ["new"]   -> full-bleed
 *   /clients/[id]/edit  segments = ["<id>","edit"] -> full-bleed
 */
export function ClientsShell({
  clients,
  defaultCurrency,
  atLimit,
  planTier,
  clientLimit,
  revenueLabel,
  children,
}: ClientsShellProps) {
  const segments = useSelectedLayoutSegments();

  const isFullBleed = segments[0] === "new" || segments[1] === "edit";

  if (isFullBleed) {
    return <div className="min-h-full">{children}</div>;
  }

  const onDetail = segments.length > 0;

  return (
    <div
      data-page-fullbleed
      className="flex min-h-0 flex-col lg:h-[calc(100dvh-var(--topbar-h)-var(--shell-inset))] lg:flex-row"
    >
      <section
        aria-label="Clients"
        className={cn(
          "min-h-0 min-w-0 flex-col lg:flex lg:w-[360px] lg:shrink-0 lg:overflow-hidden lg:border-r lg:border-border",
          onDetail ? "hidden" : "flex w-full",
        )}
      >
        <ClientsListPane
          clients={clients}
          defaultCurrency={defaultCurrency}
          atLimit={atLimit}
          planTier={planTier}
          clientLimit={clientLimit}
          revenueLabel={revenueLabel}
        />
      </section>
      <section
        aria-label="Client"
        className={cn("min-h-0 min-w-0 flex-1 flex-col lg:flex lg:overflow-hidden", onDetail ? "flex" : "hidden")}
      >
        {children}
      </section>
    </div>
  );
}
