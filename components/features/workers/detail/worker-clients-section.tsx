"use client";

import Link from "next/link";

import { ClientSection, ClientSectionEmpty, SECTION_LINK } from "@/components/features/clients/detail/client-section";
import { useWorkerHref } from "@/components/features/workers/detail/use-worker-href";
import { workerMonogram } from "@/lib/workers/worker-readiness";
import type { WorkerListRow } from "@/types";

type WorkerClientsSectionProps = {
  worker: WorkerListRow;
  title?: string;
  /** When set, the header link switches to "View all" for the Clients tab. */
  viewAll?: boolean;
  emptyText?: string;
  emptyActionLabel?: string;
  className?: string;
};

export function WorkerClientsSection({
  worker,
  title = "Client sites",
  viewAll,
  emptyText = "Not linked to any project client yet.",
  emptyActionLabel,
  className,
}: WorkerClientsSectionProps) {
  const hrefs = useWorkerHref();
  const editHref = hrefs.edit(worker.id);
  return (
    <ClientSection
      title={title}
      count={worker.clients.length}
      className={className}
      action={
        viewAll ? (
          <Link href={hrefs.detail(worker.id, "clients")} scroll={false} className={SECTION_LINK}>
            View all
          </Link>
        ) : (
          <Link href={editHref} className={SECTION_LINK}>
            Assign to client
          </Link>
        )
      }
    >
      {worker.clients.length === 0 ? (
        <ClientSectionEmpty>
          {emptyText}
          {emptyActionLabel ? (
            <Link href={editHref} className={SECTION_LINK}>
              {emptyActionLabel}
            </Link>
          ) : null}
        </ClientSectionEmpty>
      ) : (
        worker.clients.map((client) => (
          <div key={client.id} className="flex items-center gap-3 py-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--accent-soft)] text-label font-semibold text-primary">
              {workerMonogram(client.name)}
            </span>
            <p className="min-w-0 flex-1 truncate text-body font-medium text-foreground">{client.name}</p>
          </div>
        ))
      )}
    </ClientSection>
  );
}
