import { Download, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BillingInvoice, BillingInvoiceStatus } from "@/lib/billing/invoice-transform";
import { EmptyState } from "@/components/shared/empty-state";

interface BillingInvoiceHistoryProps {
  invoices: BillingInvoice[];
}

const STATUS_BADGE: Record<
  BillingInvoiceStatus,
  { label: string; className: string }
> = {
  paid: {
    label: "Paid",
    className:
      "border-transparent bg-[var(--success-soft)] text-[var(--success)]",
  },
  pending: {
    label: "Pending",
    className:
      "border-transparent bg-[var(--warning-soft)] text-[var(--warning)]",
  },
  refunded: {
    label: "Refunded",
    className:
      "bg-muted text-muted-foreground border-border",
  },
  void: {
    label: "Void",
    className:
      "bg-muted text-muted-foreground border-border",
  },
};

function formatInvoiceDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function BillingInvoiceHistory({ invoices }: BillingInvoiceHistoryProps) {
  return (
    <section>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Invoice history
      </p>

      {invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30">
          <EmptyState
            icon={Receipt}
            headline="No invoices yet"
            description="Your first invoice appears here after your first billing cycle."
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => {
                const status = STATUS_BADGE[inv.status];
                return (
                  <tr
                    key={inv.id}
                    className={cn(
                      "transition-colors hover:bg-muted/30",
                      i < invoices.length - 1 && "border-b border-border",
                    )}
                  >
                    <td className="px-4 py-3 text-foreground">
                      {formatInvoiceDate(inv.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground tabular-nums">
                      {inv.totalFormatted}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px] font-medium border rounded-full px-2 py-0.5",
                          status.className,
                        )}
                      >
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.invoiceUrl ? (
                        <a
                          href={inv.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Download className="size-3" strokeWidth={1.6} />
                          Download
                        </a>
                      ) : (
                        <span className="text-[12px] text-muted-foreground/50">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
