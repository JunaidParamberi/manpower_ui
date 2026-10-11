import Link from "next/link";

import {
  PanelCard,
  PanelCardBody,
  PanelCardFooter,
  PanelCardHeader,
} from "@/components/shared/panel-card";
import { RevenueAreaChart } from "@/components/features/finance/revenue-area-chart";
import type { MonthlyRevenuePoint, RevenueRangeId } from "@/lib/finance/types";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type Props = {
  data: MonthlyRevenuePoint[];
  currency: string;
  rangeId: RevenueRangeId;
};

function computeStats(data: MonthlyRevenuePoint[]) {
  if (data.length === 0) {
    return { total: 0, avg: 0, bestLabel: "—", bestValue: 0 };
  }
  const total = data.reduce((s, p) => s + p.revenue, 0);
  const avg = total / data.length;
  const best = data.reduce((b, p) => (p.revenue > b.revenue ? p : b), data[0]);
  return { total, avg, bestLabel: best.month, bestValue: best.revenue };
}

const RANGE_OPTIONS: { id: RevenueRangeId; label: string; caption: string }[] = [
  { id: "6m", label: "6M", caption: "Last 6 months" },
  { id: "1y", label: "1Y", caption: "Last 12 months" },
  { id: "all", label: "All", caption: "All time" },
];

export function RevenueCard({ data, currency, rangeId }: Props) {
  const stats = computeStats(data);
  const activeRange =
    RANGE_OPTIONS.find((option) => option.id === rangeId) ?? RANGE_OPTIONS[0];
  const monthCount = data.length;

  const rangeToggle = (
    <div role="group" aria-label="Range" className="flex items-center gap-0.5 rounded-md bg-[var(--bg-subtle)] p-0.5">
      {RANGE_OPTIONS.map((opt) => {
        const active = opt.id === rangeId;
        return (
          <Link
            key={opt.id}
            // The range lives in the URL so the server component can
            // re-query it; the dashboard stays a server-rendered page.
            href={`/dashboard?revenue=${opt.id}`}
            scroll={false}
            aria-current={active ? "true" : undefined}
            aria-label={opt.caption}
            className={cn(
              "flex h-6 items-center rounded-[5px] px-2 text-label font-medium no-underline transition-colors",
              active
                ? "bg-[var(--bg-surface)] text-foreground shadow-[var(--shadow-xs)]"
                : "text-[var(--fg-3)] hover:text-foreground",
            )}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <PanelCard>
      <PanelCardHeader
        title="Revenue"
        description={`${activeRange.caption} · paid in ${currency}`}
        meta={rangeToggle}
      />
      <PanelCardBody className="pt-4">
        <RevenueAreaChart data={data} currency={currency} />
      </PanelCardBody>
      <PanelCardFooter>
        <div className="flex flex-col gap-0.5">
          <span className="text-[var(--fg-3)]">Total · {activeRange.caption.toLowerCase()}</span>
          <span className="text-[15px] font-semibold tabular-nums">{formatCurrency(stats.total, currency)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[var(--fg-3)]">Avg monthly{monthCount > 0 ? ` · ${monthCount} mo` : ""}</span>
          <span className="text-[15px] font-semibold tabular-nums">{formatCurrency(stats.avg, currency)}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[var(--fg-3)]">Best month</span>
          <span className="text-[15px] font-semibold tabular-nums">
            {stats.bestLabel} · {formatCurrency(stats.bestValue, currency)}
          </span>
        </div>
      </PanelCardFooter>
    </PanelCard>
  );
}
