"use client";

import Link from "next/link";

import { ClientSection, ClientSectionEmpty, SECTION_LINK } from "@/components/features/clients/detail/client-section";
import { WorkerClientsSection } from "@/components/features/workers/detail/worker-clients-section";
import { WorkerReadinessPanel } from "@/components/features/workers/detail/worker-readiness-panel";
import { useWorkerHref } from "@/components/features/workers/detail/use-worker-href";
import { cn } from "@/lib/utils";
import { EXPIRING_SOON_DAYS, workerExpiries } from "@/lib/workers/worker-readiness";
import type { WorkerListRow } from "@/types";

export function WorkerOverview({ worker, nowIso }: { worker: WorkerListRow; nowIso: string }) {
  const expiries = workerExpiries(worker, nowIso);
  const hrefs = useWorkerHref();
  const editHref = hrefs.edit(worker.id);

  return (
    <>
      <WorkerReadinessPanel worker={worker} nowIso={nowIso} />
      <div className="grid min-w-0 gap-x-10 lg:grid-cols-2">
        <WorkerClientsSection
          worker={worker}
          viewAll
          emptyText="Not on any client site. "
          emptyActionLabel="Assign to client"
        />
        <ClientSection
          title="Expiries"
          count={expiries.length}
          action={
            <Link href={hrefs.detail(worker.id, "about")} scroll={false} className={SECTION_LINK}>
              View all
            </Link>
          }
        >
          {expiries.length === 0 ? (
            <ClientSectionEmpty>
              No expiry dates entered.{" "}
              <Link href={editHref} className={SECTION_LINK}>
                Add details
              </Link>
            </ClientSectionEmpty>
          ) : (
            expiries.map((e) => {
              const expired = e.daysLeft < 0;
              const soon = !expired && e.daysLeft <= EXPIRING_SOON_DAYS;
              return (
                <div key={e.kind} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--bg-subtle)] font-mono text-label font-semibold text-[var(--fg-2)]">
                    {e.label.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body font-medium text-foreground">{e.label}</p>
                    <p className="truncate text-meta text-[var(--fg-3)]">{expired ? "Expired" : "Valid"}</p>
                  </div>
                  {expired || soon ? (
                    <span
                      className={cn(
                        "hidden shrink-0 rounded-full px-2 py-px text-label font-medium sm:inline-flex",
                        expired
                          ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                          : "bg-[var(--warning-soft)] text-[var(--warning)]",
                      )}
                    >
                      {expired ? "Expired" : "Due soon"}
                    </span>
                  ) : null}
                  <span className="w-20 shrink-0 text-right text-body font-medium tabular-nums">
                    {expired ? `${-e.daysLeft}d ago` : `in ${e.daysLeft}d`}
                  </span>
                </div>
              );
            })
          )}
        </ClientSection>
      </div>
    </>
  );
}
