import type { FinancialSummary } from "@/lib/finance/types";
import { KpiCard } from "@/components/shared/kpi-card";
import { formatSecondaryCurrencies } from "@/lib/finance/currency-display";
import type { CurrencyAmountField } from "@/lib/finance/currency-display";

type Props = {
  summary: FinancialSummary;
};

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FinanceSummaryCards({ summary }: Props) {
  const {
    primaryCurrency: currency,
    byCurrency,
    totalRevenue,
    outstanding,
    overdue,
    avgPayDays,
    revenueChangePct,
    overdueCount,
    outstandingCount,
  } = summary;

  const revDelta =
    revenueChangePct === null
      ? null
      : `${revenueChangePct >= 0 ? "+" : ""}${revenueChangePct}%`;
  const revTrend =
    revenueChangePct === null ? "flat" : revenueChangePct >= 0 ? "up" : "down";

  /** Keeps non-headline currencies on screen instead of dropping them. */
  const withExtras = (field: CurrencyAmountField, base: string) => {
    const extras = formatSecondaryCurrencies(byCurrency, currency, field);
    return extras ? (
      <>
        {base}
        <span className="block text-[var(--fg-3)]">{extras}</span>
      </>
    ) : (
      base
    );
  };

  const avgSub =
    avgPayDays === null
      ? "No paid invoices yet"
      : avgPayDays <= 30
        ? "Faster than 30d target"
        : "Slower than 30d target";

  return (
    <div className="grid grid-cols-2 gap-3 @3xl/shell:grid-cols-4">
      <KpiCard
        delay={0}
        label="Revenue"
        value={formatMoney(totalRevenue, currency)}
        delta={revDelta}
        trend={revTrend}
        sub={withExtras("totalRevenue", "vs previous period")}
      />
      <KpiCard
        delay={80}
        label="Outstanding"
        value={formatMoney(outstanding, currency)}
        delta={`${outstandingCount}`}
        trend="flat"
        sub={withExtras(
          "outstanding",
          `${outstandingCount} invoice${outstandingCount !== 1 ? "s" : ""} pending`,
        )}
      />
      <KpiCard
        delay={160}
        label="Overdue"
        value={formatMoney(overdue, currency)}
        delta={overdueCount > 0 ? `${overdueCount}` : null}
        trend={overdueCount > 0 ? "down" : "flat"}
        sub={withExtras(
          "overdue",
          overdueCount === 0
            ? "None overdue"
            : `${overdueCount} invoice${overdueCount !== 1 ? "s" : ""} overdue`,
        )}
        variant={overdueCount > 0 ? "warning" : "default"}
      />
      <KpiCard
        delay={240}
        label="Avg. pay time"
        value={avgPayDays === null ? "—" : `${avgPayDays}d`}
        sub={avgSub}
        trend={avgPayDays !== null && avgPayDays > 30 ? "down" : "flat"}
      />
    </div>
  );
}
