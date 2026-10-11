import { daysBetweenIso } from "@/lib/clients/health-facts";
import type { DocumentListRow } from "@/types";

export type ClientFinancialSummary = {
  currency: string;
  billedTotal: number;
  paidTotal: number;
  outstandingTotal: number;
  overdueTotal: number;
  overdueCount: number;
  oldestOverdueDays: number;
  invoiceCount: number;
  /** Invoices in another currency, left out of these totals. */
  otherCurrencyCount: number;
  /** Average whole days from sent to paid over the last 3 paid invoices. */
  avgDaysToPay: number | null;
  /** Same average over the 3 paid invoices before those; null if none. */
  previousAvgDaysToPay: number | null;
};

const billableStatuses = new Set<DocumentListRow["status"]>([
  "sent",
  "viewed",
  "signed",
  "paid",
  "partially_paid",
]);

/** Invoice statuses that can still be owed. Shared with the clients list row (computeClientMoneyDue). */
const NOT_OWED_STATUSES = new Set<string>(["draft", "paid", "written_off", "voided", "archived", "declined", "approved"]);

export function isOwedInvoiceStatus(status: string): boolean {
  return !NOT_OWED_STATUSES.has(status);
}

function sameCurrency(a: string | null | undefined, b: string): boolean {
  return !a || a.toUpperCase() === b.toUpperCase();
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function computeClientFinancialSummary({
  documents,
  fallbackCurrency,
  today = new Date(),
}: {
  documents: DocumentListRow[];
  fallbackCurrency: string;
  today?: Date;
}): ClientFinancialSummary {
  const currency = fallbackCurrency;
  const billable = documents.filter(
    (doc) => doc.type === "invoice" && billableStatuses.has(doc.status),
  );
  const invoices = billable.filter((doc) => sameCurrency(doc.currency, currency));

  const payDays = invoices
    .filter(
      (doc): doc is DocumentListRow & { sent_at: string; paid_at: string } =>
        doc.status === "paid" && Boolean(doc.sent_at) && Boolean(doc.paid_at),
    )
    .sort((a, b) => b.paid_at.localeCompare(a.paid_at))
    .map((doc) => Math.max(0, daysBetweenIso(doc.sent_at, doc.paid_at)));

  const base: ClientFinancialSummary = {
    currency,
    billedTotal: 0,
    paidTotal: 0,
    outstandingTotal: 0,
    overdueTotal: 0,
    overdueCount: 0,
    oldestOverdueDays: 0,
    invoiceCount: 0,
    otherCurrencyCount: billable.length - invoices.length,
    avgDaysToPay: average(payDays.slice(0, 3)),
    previousAvgDaysToPay: average(payDays.slice(3, 6)),
  };

  return invoices.reduce<ClientFinancialSummary>((summary, doc) => {
    const amount = doc.total_amount ?? 0;
    const paid = doc.status === "paid" ? amount : Math.min(amount, doc.amount_paid ?? 0);
    const balance = isOwedInvoiceStatus(doc.status) ? Math.max(0, amount - paid) : 0;
    const late =
      balance > 0 && doc.due_date ? Math.max(0, daysBetweenIso(doc.due_date, today.toISOString())) : 0;
    return {
      ...summary,
      billedTotal: summary.billedTotal + amount,
      paidTotal: summary.paidTotal + paid,
      outstandingTotal: summary.outstandingTotal + balance,
      overdueTotal: summary.overdueTotal + (late > 0 ? balance : 0),
      overdueCount: summary.overdueCount + (late > 0 ? 1 : 0),
      oldestOverdueDays: Math.max(summary.oldestOverdueDays, late),
      invoiceCount: summary.invoiceCount + 1,
    };
  }, base);
}
