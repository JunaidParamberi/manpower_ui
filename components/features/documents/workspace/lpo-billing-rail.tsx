import Link from "next/link";
import { FileDown } from "lucide-react";
import type { LpoBillingProgress } from "@/lib/documents/lpo/billing-progress";
import { CreateInvoiceFromLpoButton } from "../lpo/create-invoice-from-lpo-button";
import { LpoBillingProgress as BillingProgressPanel } from "../lpo/lpo-billing-progress";
import { RailSection } from "./rail/rail-section";

export type LinkedInvoice = { id: string; title: string; invoice_number: string | null; status: string };

/** What has been billed against a purchase order, the invoices raised, and the client's PDF. */
export function LpoBillingRail({
  documentId, currency, progress, linkedInvoices, pdfUrl,
}: {
  documentId: string;
  currency: string;
  progress: LpoBillingProgress | null;
  linkedInvoices: LinkedInvoice[];
  pdfUrl: string | null;
}) {
  return (
    <RailSection title="Billing">
      {progress ? <div className="px-1"><BillingProgressPanel progress={progress} currency={currency} /></div> : null}
      <div className="px-2 pt-1">
        <CreateInvoiceFromLpoButton lpoId={documentId} />
      </div>
      {linkedInvoices.length > 0 ? (
        <ul className="mt-1 flex flex-col">
          {linkedInvoices.map((inv) => (
            <li key={inv.id}>
              <Link
                href={`/documents/${inv.id}`}
                className="flex min-h-9 items-center justify-between gap-2 rounded-[var(--item-radius)] py-1 pr-1.5 pl-2 text-[13px] hover:bg-[var(--bg-subtle)]"
              >
                <span className="truncate">{inv.invoice_number ?? inv.title}</span>
                <span className="shrink-0 text-[12px] text-[var(--fg-3)]">{inv.status.replace(/_/g, " ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {pdfUrl ? (
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center gap-1.5 px-2 py-1 text-[12px] text-[var(--accent)] hover:underline"
        >
          <FileDown className="size-3.5" />
          Open the client&rsquo;s LPO
        </a>
      ) : null}
    </RailSection>
  );
}
