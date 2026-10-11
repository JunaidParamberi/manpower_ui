import { differenceInDays, parseISO } from "date-fns";

type LineItemLike = {
  quantity: string | number;
  unit_price: string | number;
  tax_rate?: string | number | null;
};

export function calcLineItemsTotal(items: LineItemLike[]): number {
  return items.reduce(
    (sum, li) => sum + Number(li.quantity) * Number(li.unit_price),
    0
  );
}

export function applyDiscount(
  subtotal: number,
  discountType: "percent" | "flat",
  discountValue: number
): number {
  if (discountValue === 0) return subtotal;
  if (discountType === "percent") {
    return subtotal * (1 - discountValue / 100);
  }
  return Math.max(0, subtotal - discountValue);
}

type PaidInvoiceLike = {
  sent_at: string | null;
  paid_at: string | null;
};

export function calcAvgPayDays(invoices: PaidInvoiceLike[]): number | null {
  const valid = invoices.filter((i) => i.sent_at && i.paid_at);
  if (valid.length === 0) return null;
  const totalDays = valid.reduce((sum, i) => {
    return sum + differenceInDays(parseISO(i.paid_at!), parseISO(i.sent_at!));
  }, 0);
  return Math.round(totalDays / valid.length);
}

export function calcTaxTotal(items: LineItemLike[]): number {
  return items.reduce(
    (sum, li) =>
      sum +
      Number(li.quantity) *
        Number(li.unit_price) *
        (Number(li.tax_rate ?? 0) / 100),
    0
  );
}

export function calcRevenueChangePct(
  current: number,
  previous: number
): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export type RevenuePaymentLike = {
  amount: number;
  paid_at: string;
};

export type MonthlyRevenueBucket = {
  monthKey: string;
  revenue: number;
};

/**
 * Buckets payments into calendar months and fills the gaps, so a month with
 * no income renders as a zero point instead of vanishing and making the chart
 * lie about the shape of the trend. The series starts at the first month that
 * actually has money (an "all time" range would otherwise emit decades of
 * empty months) and runs to `nowKey`.
 */
export function buildMonthlyRevenueBuckets(
  payments: RevenuePaymentLike[],
  nowKey: string,
): MonthlyRevenueBucket[] {
  const byMonth = new Map<string, number>();
  for (const payment of payments) {
    if (!payment.paid_at) continue;
    const monthKey = payment.paid_at.slice(0, 7);
    byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + Number(payment.amount));
  }
  if (byMonth.size === 0) return [];

  const keys = [...byMonth.keys()].sort();
  const out: MonthlyRevenueBucket[] = [];
  let cursor = keys[0];
  const last = keys[keys.length - 1] > nowKey ? keys[keys.length - 1] : nowKey;

  while (cursor <= last) {
    out.push({
      monthKey: cursor,
      revenue: Math.round((byMonth.get(cursor) ?? 0) * 100) / 100,
    });
    cursor = nextMonthKey(cursor);
  }
  return out;
}

function nextMonthKey(monthKey: string): string {
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  return month === 12
    ? `${year + 1}-01`
    : `${year}-${String(month + 1).padStart(2, "0")}`;
}
