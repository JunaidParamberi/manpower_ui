import Link from "next/link";

import { ClientSection, ClientSectionEmpty, SECTION_LINK } from "@/components/features/clients/detail/client-section";
import { workerMonogram } from "@/lib/workers/worker-readiness";
import type { WorkerListRow } from "@/types";

type WorkerClientsSectionProps = {
  worker: WorkerListRow;
  title?: string;
  /** When set, the header link switches to "View all" for that tab. */
  viewAllHref?: string;
  emptyText?: string;
  emptyActionLabel?: string;
  className?: string;
};

export function WorkerClientsSection({
  worker,
  title = "Client sites",
  viewAllHref,
  emptyText = "Not linked to any project client yet.",
  emptyActionLabel,
  className,
}: WorkerClientsSectionProps) {
  const editHref = `/workers/${worker.id}/edit`;
  return (
    <ClientSection
      title={title}
      count={worker.clients.length}
      className={className}
      action={
        viewAllHref ? (
          <Link href={viewAllHref} scroll={false} className={SECTION_LINK}>
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
