import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PaymentRow } from "@/types";
import { PaymentHistory } from "../payment-history";
import { CopyLinkRow } from "./copy-link-row";
import { RailSection } from "./rail/rail-section";

export type InvoiceBalance = { invoiceTotal: number; totalPaid: number; totalWrittenOff: number; balanceDue: number };

const money = (currency: string, n: number) =>
  `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Paid progress, the money rows, payment history and the pay link, as a rail section. */
export function InvoiceBalanceRail({
  balance, payments, currency, homeCurrency, voucherByPaymentId, payUrl, latestReceipt,
}: {
  balance: InvoiceBalance | null;
  payments: PaymentRow[];
  currency: string;
  homeCurrency: string;
  voucherByPaymentId: Record<string, { id: string; receipt_number: string | null }>;
  payUrl: string | null;
  latestReceipt?: { id: string; receipt_number: string | null } | null;
}) {
  if (!balance) return null;
  const collectable = Math.max(balance.invoiceTotal - balance.totalWrittenOff, 0);
  const pct = collectable > 0 ? Math.min(100, (balance.totalPaid / collectable) * 100) : 0;
  const row = (label: string, value: string, className?: string) => (
    <div className="flex items-center justify-between px-2 py-0.5 text-[13px]">
      <span className="text-[var(--fg-2)]">{label}</span>
      <span className={cn("tabular-nums", className)}>{value}</span>
    </div>
  );
  return (
    <RailSection title="Balance">
      <div
        role="progressbar"
        aria-label="Paid"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className="mx-2 mb-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]"
      >
        <div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${pct}%` }} />
      </div>
      {row("Total", money(currency, balance.invoiceTotal))}
      {balance.totalPaid > 0 ? row("Paid", money(currency, balance.totalPaid), "text-[var(--success)]") : null}
      {balance.totalWrittenOff > 0 ? row("Written off", money(currency, balance.totalWrittenOff)) : null}
      {row("Balance due", money(currency, balance.balanceDue), cn("font-semibold", balance.balanceDue > 0 ? "text-[var(--warning)]" : "text-[var(--success)]"))}
      {payUrl && balance.balanceDue > 0 ? <CopyLinkRow label="Pay link" url={payUrl} /> : null}
      {latestReceipt ? (
        <Link href={`/documents/${latestReceipt.id}`} className="mt-1 px-2 text-[12px] text-[var(--fg-2)] hover:text-[var(--fg)]">
          View latest receipt{latestReceipt.receipt_number ? ` (${latestReceipt.receipt_number})` : ""}
        </Link>
      ) : null}
      {payments.length > 0 ? (
        <div className="mt-2 px-1">
          <PaymentHistory payments={payments} currency={currency} homeCurrency={homeCurrency} voucherByPaymentId={voucherByPaymentId} />
        </div>
      ) : null}
    </RailSection>
  );
}
