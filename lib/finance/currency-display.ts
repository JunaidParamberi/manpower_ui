import type { CurrencyBreakdown } from "@/lib/finance/summary-calc";
import { formatCurrency } from "@/lib/utils/format";

export type CurrencyAmountField = "totalRevenue" | "outstanding" | "overdue";

export type SecondaryCurrencyAmount = {
  currency: string;
  amount: number;
};

/**
 * Money held in currencies other than the headline one. The KPI cards show a
 * single primary figure; without this the other currencies would silently
 * vanish from the dashboard the way they used to when only the profile's
 * base-currency bucket was ever rendered.
 */
export function secondaryCurrencyAmounts(
  byCurrency: CurrencyBreakdown[],
  primaryCurrency: string,
  field: CurrencyAmountField,
): SecondaryCurrencyAmount[] {
  return byCurrency
    .filter((bucket) => bucket.currency !== primaryCurrency && bucket[field] > 0)
    .map((bucket) => ({ currency: bucket.currency, amount: bucket[field] }))
    .sort((a, b) => b.amount - a.amount);
}

/** "+ $800 · + ₹1,200", or null when every amount is in the primary currency. */
export function formatSecondaryCurrencies(
  byCurrency: CurrencyBreakdown[],
  primaryCurrency: string,
  field: CurrencyAmountField,
): string | null {
  const extras = secondaryCurrencyAmounts(byCurrency, primaryCurrency, field);
  if (extras.length === 0) return null;
  return extras
    .map((extra) => `+ ${formatCurrency(extra.amount, extra.currency)}`)
    .join(" · ");
}
