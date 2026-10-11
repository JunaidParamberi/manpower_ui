// components/features/dashboard/money-row.tsx
import { CountUp } from "@/components/shared/count-up";
import { KpiCard } from "@/components/shared/kpi-card";
import { formatSecondaryCurrencies } from "@/lib/finance/currency-display";
import type { CurrencyAmountField } from "@/lib/finance/currency-display";
import type { CurrencyBreakdown } from "@/lib/finance/summary-calc";
import type { MoneyFacts } from "@/lib/dashboard/snapshot-types";
import { formatCurrency } from "@/lib/utils/format";

type Props = {
  money: MoneyFacts;
};

/**
 * Sub-line that keeps non-headline currencies visible. The headline is a
 * single currency, so without this a user whose invoices are in a different
 * currency than their profile default sees money that appears to be missing.
 */
function CurrencySub({
  byCurrency,
  primaryCurrency,
  field,
  children,
}: {
  byCurrency: CurrencyBreakdown[];
  primaryCurrency: string;
  field: CurrencyAmountField;
  children: React.ReactNode;
}) {
  const extras = formatSecondaryCurrencies(byCurrency, primaryCurrency, field);
  return (
    <>
      {children}
      {extras ? <span className="block text-[var(--fg-3)]">{extras}</span> : null}
    </>
  );
}

export function MoneyRow({ money }: Props) {
  const { primaryCurrency: currency, byCurrency } = money;
  const {
    totalRevenue,
    revenueChangePct,
    outstanding,
    outstandingCount,
    overdue,
    overdueCount,
    avgPayDays,
  } = money;

  const revDelta =
    revenueChangePct === null
      ? "New"
      : `${revenueChangePct >= 0 ? "+" : ""}${revenueChangePct}%`;
  const revTrend =
    revenueChangePct === null ? "flat" : revenueChangePct >= 0 ? "up" : "down";

  const outstandingDelta =
    outstandingCount > 0
      ? `${outstandingCount} invoice${outstandingCount !== 1 ? "s" : ""}`
      : "Up to date";
  const outstandingTrend: "up" | "down" | "flat" =
    outstandingCount > 0 ? "flat" : "up";

  const overdueDelta =
    overdueCount > 0
      ? `${overdueCount} invoice${overdueCount !== 1 ? "s" : ""}`
      : "All clear";
  const overdueTrend: "up" | "down" | "flat" =
    overdueCount > 0 ? "down" : "up";

  const avgPayValue =
    avgPayDays !== null ? `${avgPayDays.toFixed(1)} days` : "—";
  const avgPayDelta = avgPayDays !== null ? "tracked" : null;

  return (
    <div className="grid gap-3 @sm/shell:grid-cols-2 @3xl/shell:grid-cols-4">
      <KpiCard
        label="Revenue this month"
        value={<CountUp value={totalRevenue} format="currency" currency={currency} />}
        delta={revDelta}
        trend={revTrend}
        sub={
          <CurrencySub
            byCurrency={byCurrency}
            primaryCurrency={currency}
            field="totalRevenue"
          >
            vs. last month
          </CurrencySub>
        }
        delay={0}
      />
      <KpiCard
        label="Outstanding"
        value={<CountUp value={outstanding} format="currency" currency={currency} />}
        delta={outstandingDelta}
        trend={outstandingTrend}
        sub={
          <CurrencySub
            byCurrency={byCurrency}
            primaryCurrency={currency}
            field="outstanding"
          >
            {outstandingCount > 0
              ? `${formatCurrency(outstanding, currency)} unpaid`
              : "No unpaid invoices"}
          </CurrencySub>
        }
        delay={60}
      />
      <KpiCard
        label="Overdue"
        value={<CountUp value={overdue} format="currency" currency={currency} />}
        delta={overdueDelta}
        trend={overdueTrend}
        sub={
          <CurrencySub byCurrency={byCurrency} primaryCurrency={currency} field="overdue">
            {overdueCount > 0 ? `${overdueCount} at risk` : "All clear"}
          </CurrencySub>
        }
        variant={overdueCount > 0 ? "danger" : "default"}
        delay={120}
      />
      <KpiCard
        label="Avg. pay time"
        value={avgPayValue}
        delta={avgPayDelta}
        trend="flat"
        sub={avgPayDays !== null ? "across paid invoices" : "no paid invoices yet"}
        delay={180}
      />
    </div>
  );
}