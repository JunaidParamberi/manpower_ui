import Link from "next/link";
import type { PaymentMethod, PaymentRow } from "@/types";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
  cheque: "Cheque",
  card: "Card",
  other: "Other",
};

interface PaymentHistoryProps {
  payments: PaymentRow[];
  currency: string;
  homeCurrency?: string;
  voucherByPaymentId?: Record<string, { id: string; receipt_number: string | null }>;
}

export function PaymentHistory({
  payments,
  currency,
  homeCurrency,
  voucherByPaymentId = {},
}: PaymentHistoryProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(n);
  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold">Payment history</h2>

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments recorded.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {payments.map((p) => (
              <div key={p.id} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {METHOD_LABELS[p.method as PaymentMethod] ?? p.method}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(p.paid_at)}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums text-emerald-600">
                    {fmt(Number(p.amount))}
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-xs">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="min-w-0 text-right text-muted-foreground">
                    {p.reference ?? "—"}
                  </span>
                  {p.fx_rate != null && (
                    <>
                      <span className="text-muted-foreground">FX rate</span>
                      <span className="min-w-0 text-right text-muted-foreground">
                        1 {p.currency || currency} = {Number(p.fx_rate)} {homeCurrency || "USD"}
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground">Receipt</span>
                  <span className="min-w-0 text-right">
                    {voucherByPaymentId[p.id] ? (
                      <Link
                        href={`/documents/${voucherByPaymentId[p.id].id}`}
                        className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {voucherByPaymentId[p.id].receipt_number ?? "View receipt"}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <table className="hidden w-full text-sm sm:table">
            <thead>
              <tr className="border-b border-border/50 text-left text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Date</th>
                <th className="pb-2 pr-4 font-medium">Method</th>
                <th className="pb-2 pr-4 font-medium">Reference</th>
                <th className="pb-2 pr-4 font-medium">Receipt</th>
                <th className="pb-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border/30 last:border-0">
                  <td className="py-2 pr-4 text-muted-foreground">
                    {formatDate(p.paid_at)}
                  </td>
                  <td className="py-2 pr-4">
                    <div>{METHOD_LABELS[p.method as PaymentMethod] ?? p.method}</div>
                    {p.fx_rate != null && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        1 {p.currency || currency} = {Number(p.fx_rate)} {homeCurrency || "USD"}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {p.reference ?? "—"}
                  </td>
                  <td className="py-2 pr-4">
                    {voucherByPaymentId[p.id] ? (
                      <Link
                        href={`/documents/${voucherByPaymentId[p.id].id}`}
                        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {voucherByPaymentId[p.id].receipt_number ?? "View receipt"}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 text-right font-medium text-emerald-600">
                    {fmt(Number(p.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
