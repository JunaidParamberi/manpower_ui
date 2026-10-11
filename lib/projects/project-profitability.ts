import { calculateInvoiceTotal } from "@/lib/documents/payment-balance";
import type { DigestInvoiceInput } from "@/lib/projects/digest-facts";
import type { TimeEntryListRow } from "@/types";

export type ProfitabilityInvoice = {
  total_amount: number | null;
  payments: { amount: number }[];
};

export type ProjectProfitability = {
  invoicedTotal: number;
  collectedTotal: number;
  outstandingTotal: number;
  expenseCost: number;
  /** collectedTotal − expenseCost */
  margin: number;
  /** Unbilled minutes × hourly_rate (0 when no rate set) */
  unbilledTimeValue: number;
  /** collectedTotal / trackedHours (null when no hours tracked) */
  effectiveHourlyRate: number | null;
  trackedMinutes: number;
  billedMinutes: number;
  unbilledMinutes: number;
};

export function buildProjectProfitability(args: {
  invoices: ProfitabilityInvoice[];
  expenses: { amount: number }[];
  timeEntries: Pick<TimeEntryListRow, "duration_seconds" | "billed">[];
  hourlyRate: number | null;
}): ProjectProfitability {
  const invoicedTotal = args.invoices.reduce(
    (sum, inv) => sum + (inv.total_amount ?? 0),
    0,
  );
  const collectedTotal = args.invoices.reduce(
    (sum, inv) =>
      sum + inv.payments.reduce((s, p) => s + p.amount, 0),
    0,
  );
  const outstandingTotal = Math.max(0, invoicedTotal - collectedTotal);
  const expenseCost = args.expenses.reduce((sum, e) => sum + e.amount, 0);
  const margin = collectedTotal - expenseCost;

  const trackedMinutes = Math.round(
    args.timeEntries.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0) /
      60,
  );
  const billedMinutes = Math.round(
    args.timeEntries
      .filter((e) => e.billed)
      .reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0) / 60,
  );
  const unbilledMinutes = Math.max(0, trackedMinutes - billedMinutes);

  const hourlyRate = args.hourlyRate ?? 0;
  const unbilledTimeValue = hourlyRate > 0 ? (unbilledMinutes / 60) * hourlyRate : 0;

  const trackedHours = trackedMinutes / 60;
  const effectiveHourlyRate =
    trackedHours > 0 ? collectedTotal / trackedHours : null;

  return {
    invoicedTotal,
    collectedTotal,
    outstandingTotal,
    expenseCost,
    margin,
    unbilledTimeValue,
    effectiveHourlyRate,
    trackedMinutes,
    billedMinutes,
    unbilledMinutes,
  };
}

type Num = number | string;

/** A project invoice as selected in `profitability-queries.ts`. */
export type ProfitabilityInvoiceRow = {
  id: string;
  project_id: string | null;
  status: string;
  due_date: string | null;
  discount_value: Num | null;
  discount_type: string | null;
  tax_mode: string | null;
  tax_rate: Num | null;
  line_items: { quantity: Num; unit_price: Num; tax_rate: Num | null }[] | null;
  payments: { amount: Num }[] | null;
  invoice_adjustments: { amount: Num; type: string }[] | null;
};

/**
 * Invoice rows → profitability inputs. Totals come from the canonical
 * `calculateInvoiceTotal` (discount, then document or line-item tax), the
 * same figure the invoice itself shows.
 */
export function mapProfitabilityInvoiceRows(rows: ProfitabilityInvoiceRow[]): {
  invoices: ProfitabilityInvoice[];
  digestInvoices: DigestInvoiceInput[];
} {
  const invoices: ProfitabilityInvoice[] = [];
  const digestInvoices: DigestInvoiceInput[] = [];

  for (const row of rows) {
    const total = calculateInvoiceTotal(
      row.line_items ?? [],
      Number(row.discount_value ?? 0),
      row.discount_type === "flat" ? "flat" : "percent",
      { taxMode: row.tax_mode, taxRate: row.tax_rate },
    );
    const payments = (row.payments ?? []).map((p) => ({ amount: Number(p.amount) }));
    const paid = payments.reduce((sum, p) => sum + p.amount, 0);
    const writtenOff = (row.invoice_adjustments ?? [])
      .filter((a) => a.type === "write_off")
      .reduce((sum, a) => sum + Number(a.amount), 0);

    invoices.push({ total_amount: total, payments });
    // Outstanding balance (total minus payments and write-offs), the same
    // house rule the project-intelligence Edge Function applies — never the
    // gross total, which overstates money genuinely at risk.
    digestInvoices.push({
      id: row.id,
      projectId: row.project_id,
      status: row.status,
      dueDate: row.due_date,
      total: Math.max(0, total - paid - writtenOff),
    });
  }

  return { invoices, digestInvoices };
}
