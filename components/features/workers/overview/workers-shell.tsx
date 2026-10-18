"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegments } from "next/navigation";

import { WorkersListPane } from "@/components/features/workers/overview/workers-list-pane";
import { cn } from "@/lib/utils";
import type { WorkerListRow } from "@/types";

type WorkersShellProps = {
  workers: WorkerListRow[];
  children: ReactNode;
};

/**
 * Responsive master-detail shell for the workers section. Mirrors
 * components/features/clients/overview/clients-shell.tsx: list pane 360px,
 * a border, then the detail.
 *
 * Route -> segment behaviour:
 *   /workers            segments = []        -> split, mobile shows list
 *   /workers/[id]       segments = ["<id>"]  -> split, mobile shows detail
 *   /workers/new        segments = ["new"]   -> full-bleed
 *   /workers/[id]/edit  segments = ["<id>","edit"] -> full-bleed
 */
export function WorkersShell({ workers, children }: WorkersShellProps) {
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
        aria-label="Workers"
        className={cn(
          "min-h-0 min-w-0 flex-col lg:flex lg:w-[360px] lg:shrink-0 lg:overflow-hidden lg:border-r lg:border-border",
          onDetail ? "hidden" : "flex w-full",
        )}
      >
        <WorkersListPane workers={workers} />
      </section>
      <section
        aria-label="Worker"
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col lg:flex lg:overflow-hidden",
          onDetail ? "flex" : "hidden",
        )}
      >
        {children}
      </section>
    </div>
  );
}
