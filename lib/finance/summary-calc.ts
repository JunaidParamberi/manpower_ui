import { parseISO } from "date-fns";

export type SummaryPayment = { amount: number; currency: string };
export type SummaryOpenInvoice = {
  total: number;
  paid: number;
  writtenOff: number;
  currency: string;
  dueDate: string | null;
};

export type CurrencyBreakdown = {
  currency: string;
  totalRevenue: number;
  outstanding: number;
  overdue: number;
  outstandingCount: number;
  overdueCount: number;
};

export type AggregatedSummary = {
  /**
   * The currency the headline numbers are expressed in. Normally the user's
   * base currency; when that bucket is empty but another currency holds money
   * we promote the busiest bucket instead, so a user whose profile currency
   * doesn't match their invoices never sees a headline 0 next to real money.
   */
  primaryCurrency: string;
  totalRevenue: number;
  outstanding: number;
  overdue: number;
  outstandingCount: number;
  overdueCount: number;
  byCurrency: CurrencyBreakdown[];
};

function toMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function bucketWeight(b: CurrencyBreakdown): number {
  return b.totalRevenue + b.outstanding;
}

/**
 * The base currency wins whenever it holds any money. Otherwise the bucket
 * with the most money (revenue + outstanding) is promoted, so the headline
 * KPIs describe the money the user actually has rather than an empty bucket.
 */
function pickPrimaryBucket(
  buckets: Map<string, CurrencyBreakdown>,
  baseCurrency: string,
): CurrencyBreakdown {
  const empty: CurrencyBreakdown = {
    currency: baseCurrency,
    totalRevenue: 0,
    outstanding: 0,
    overdue: 0,
    outstandingCount: 0,
    overdueCount: 0,
  };

  const base = buckets.get(baseCurrency);
  if (base && bucketWeight(base) > 0) return base;

  let best: CurrencyBreakdown | null = null;
  for (const bucket of buckets.values()) {
    if (bucketWeight(bucket) <= 0) continue;
    if (best === null || bucketWeight(bucket) > bucketWeight(best)) best = bucket;
  }

  return best ?? base ?? empty;
}

export function aggregateFinancialSummary(input: {
  baseCurrency: string;
  payments: SummaryPayment[];
  openInvoices: SummaryOpenInvoice[];
  now: Date;
}): AggregatedSummary {
  const buckets = new Map<string, CurrencyBreakdown>();
  const bucket = (currency: string): CurrencyBreakdown => {
    let b = buckets.get(currency);
    if (!b) {
      b = { currency, totalRevenue: 0, outstanding: 0, overdue: 0, outstandingCount: 0, overdueCount: 0 };
      buckets.set(currency, b);
    }
    return b;
  };

  for (const p of input.payments) {
    bucket(p.currency).totalRevenue = toMoney(bucket(p.currency).totalRevenue + p.amount);
  }

  for (const inv of input.openInvoices) {
    const balance = toMoney(inv.total - inv.paid - inv.writtenOff);
    if (balance <= 0) continue;
    const b = bucket(inv.currency);
    b.outstanding = toMoney(b.outstanding + balance);
    b.outstandingCount += 1;
    if (inv.dueDate && parseISO(inv.dueDate) < input.now) {
      b.overdue = toMoney(b.overdue + balance);
      b.overdueCount += 1;
    }
  }

  const primary = pickPrimaryBucket(buckets, input.baseCurrency);

  return {
    primaryCurrency: primary.currency,
    totalRevenue: primary.totalRevenue,
    outstanding: primary.outstanding,
    overdue: primary.overdue,
    outstandingCount: primary.outstandingCount,
    overdueCount: primary.overdueCount,
    byCurrency: [...buckets.values()].sort((a, b) => a.currency.localeCompare(b.currency)),
  };
}
