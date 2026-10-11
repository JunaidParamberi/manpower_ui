const PAID_STATUSES = new Set(["paid", "partially_paid"]);

type InvoiceSummary = {
  total_amount: number;
  status: string;
};

export type LpoBillingProgress = {
  lpo_amount: number | null;
  invoiced_amount: number;
  paid_amount: number;
  invoiced_pct: number;
  paid_pct: number;
  over_ceiling: boolean;
};

export function computeBillingProgress({
  lpoAmount,
  invoices,
}: {
  lpoAmount: number | null;
  invoices: InvoiceSummary[];
}): LpoBillingProgress {
  const invoiced_amount = invoices.reduce(
    (sum, inv) => sum + Number(inv.total_amount),
    0,
  );
  const paid_amount = invoices
    .filter((inv) => PAID_STATUSES.has(inv.status))
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const ceiling = lpoAmount != null ? Number(lpoAmount) : null;
  const invoiced_pct =
    ceiling && ceiling > 0 ? Math.round((invoiced_amount / ceiling) * 100) : 0;
  const paid_pct =
    ceiling && ceiling > 0 ? Math.round((paid_amount / ceiling) * 100) : 0;

  return {
    lpo_amount: ceiling,
    invoiced_amount,
    paid_amount,
    invoiced_pct,
    paid_pct,
    over_ceiling: ceiling != null && invoiced_amount > ceiling,
  };
}
