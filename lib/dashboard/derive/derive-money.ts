import { aggregateFinancialSummary } from "@/lib/finance/summary-calc";
import { calcAvgPayDays, calcRevenueChangePct } from "@/lib/finance/revenue-calc";
import type { MoneyFacts } from "@/lib/dashboard/snapshot-types";

export type DeriveMoneyArgs = {
  baseCurrency: string;
  payments: { amount: number; currency: string }[];
  previousPayments: { amount: number; currency: string }[];
  openInvoices: {
    total: number;
    paid: number;
    writtenOff: number;
    currency: string;
    dueDate: string | null;
  }[];
  paidInvoices: { sent_at: string | null; paid_at: string | null }[];
  now: Date;
};

export function deriveMoney(args: DeriveMoneyArgs): MoneyFacts {
  const summary = aggregateFinancialSummary({
    baseCurrency: args.baseCurrency,
    payments: args.payments,
    openInvoices: args.openInvoices,
    now: args.now,
  });

  const previous = aggregateFinancialSummary({
    baseCurrency: args.baseCurrency,
    payments: args.previousPayments,
    openInvoices: [],
    now: args.now,
  });

  // Like for like: the previous period measured in the currency the headline
  // is being shown in, not in whatever that period's own busiest bucket was.
  const previousRevenue =
    previous.byCurrency.find((b) => b.currency === summary.primaryCurrency)?.totalRevenue ?? 0;

  return {
    primaryCurrency: summary.primaryCurrency,
    totalRevenue: summary.totalRevenue,
    outstanding: summary.outstanding,
    overdue: summary.overdue,
    outstandingCount: summary.outstandingCount,
    overdueCount: summary.overdueCount,
    byCurrency: summary.byCurrency,
    avgPayDays: calcAvgPayDays(args.paidInvoices),
    revenueChangePct: calcRevenueChangePct(summary.totalRevenue, previousRevenue),
  };
}
