import Link from "next/link";

import {
  documentListStatusLabel,
  formatDocumentAmount,
  getDocumentListNumber,
  isDocumentOverdue,
} from "@/lib/documents/display";
import type { DocumentListRow } from "@/types";
import { cn } from "@/lib/utils";
import { ClientSection, ClientSectionEmpty, SECTION_LINK } from "@/components/features/clients/detail/client-section";

const TYPE_TILE: Record<DocumentListRow["type"], string> = {
  invoice: "IN",
  quote: "QT",
  proposal: "PR",
  receipt: "RC",
  local_purchase_order: "PO",
  other: "DC",
  statement: "ST",
  credit_note: "CN",
  delivery_note: "DN",
};

function statusTone(status: DocumentListRow["status"], overdue: boolean): string {
  if (overdue) return "bg-[var(--danger-soft)] text-[var(--danger)]";
  if (status === "paid" || status === "approved" || status === "signed") {
    return "bg-[var(--success-soft)] text-[var(--success)]";
  }
  if (status === "sent" || status === "viewed" || status === "partially_paid") {
    return "bg-[var(--warning-soft)] text-[var(--warning)]";
  }
  return "bg-[var(--bg-subtle)] text-[var(--fg-2)]";
}

type ClientDocumentsSectionProps = {
  clientId: string;
  documents: DocumentListRow[];
  /** Fallback when a document carries no client currency. */
  currency: string;
  title?: string;
  count?: number;
  viewAllHref?: string;
};

export function ClientDocumentsSection({
  clientId,
  documents,
  currency,
  title = "Documents",
  count,
  viewAllHref,
}: ClientDocumentsSectionProps) {
  const newHref = `/documents/new?type=invoice&client=${clientId}`;
  return (
    <ClientSection
      title={title}
      count={count ?? documents.length}
      action={
        viewAllHref ? (
          <Link href={viewAllHref} scroll={false} className={SECTION_LINK}>
            View all
          </Link>
        ) : (
          <Link href={newHref} className={SECTION_LINK}>
            New invoice
          </Link>
        )
      }
    >
      {documents.length === 0 ? (
        <ClientSectionEmpty>
          Nothing open.{" "}
          <Link href={newHref} className={SECTION_LINK}>
            Create an invoice
          </Link>
        </ClientSectionEmpty>
      ) : (
        documents.map((doc) => {
          const overdue = isDocumentOverdue({ status: doc.status, dueDate: doc.due_date });
          return (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="group flex items-center gap-3 py-2.5"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--bg-subtle)] font-mono text-label font-semibold text-[var(--fg-2)]">
                {TYPE_TILE[doc.type]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body font-medium tabular-nums text-foreground group-hover:underline">{getDocumentListNumber(doc)}</p>
                <p className="truncate text-meta text-[var(--fg-3)]">{doc.project?.title ?? doc.title}</p>
              </div>
              <span
                className={cn(
                  "hidden shrink-0 rounded-full px-2 py-px text-label font-medium sm:inline-flex",
                  statusTone(doc.status, overdue),
                )}
              >
                {documentListStatusLabel(doc.status, overdue)}
              </span>
              <span className="w-28 shrink-0 text-right text-body font-medium tabular-nums">
                {formatDocumentAmount(doc.total_amount, doc.currency || currency)}
              </span>
            </Link>
          );
        })
      )}
    </ClientSection>
  );
}
