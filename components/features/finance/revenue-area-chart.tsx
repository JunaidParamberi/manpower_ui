"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MonthlyRevenuePoint } from "@/lib/finance/types";

type Props = {
  data: MonthlyRevenuePoint[];
  currency: string;
};

function getCurrencySymbol(currency: string): string {
  return (
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}

function makeYAxisFormatter(currency: string): (value: number) => string {
  const symbol = getCurrencySymbol(currency);
  return (value: number) => {
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(0)}k`;
    return `${symbol}${value}`;
  };
}

function makeTooltip(currency: string) {
  return function ChartTooltip({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: MonthlyRevenuePoint }>;
  }) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
      <div className="rounded-lg bg-card px-3 py-2.5 shadow-lg shadow-black/8 ring-1 ring-border/50">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {point.month}
        </p>
        <p className="mt-0.5 font-heading text-base font-semibold tabular-nums text-foreground">
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 0,
          }).format(point.revenue)}
        </p>
        {point.isCurrent && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">Partial month</p>
        )}
      </div>
    );
  };
}

function getPrevMonthLabel(monthLabel: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [mon, year] = monthLabel.split(" ");
  const idx = months.indexOf(mon);
  if (idx === -1 || !year) return `Prev ${year ?? ""}`.trim();
  const prevIdx = (idx - 1 + 12) % 12;
  const prevYear = idx === 0 ? String(Number(year) - 1) : year;
  return `${months[prevIdx]} ${prevYear}`;
}

export function RevenueTrendChart({ data, currency }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">No revenue data for this period</p>
      </div>
    );
  }

  // Recharts needs ≥2 points to draw line/area; pad with a leading zero when needed
  const chartData: MonthlyRevenuePoint[] =
    data.length === 1
      ? [{ month: getPrevMonthLabel(data[0].month), monthKey: "", revenue: 0, isCurrent: false }, ...data]
      : data;

  const fewPoints = chartData.length <= 3;
  const formatYAxis = makeYAxisFormatter(currency);
  const ChartTooltip = makeTooltip(currency);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          strokeOpacity={0.5}
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 400 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) => v.split(" ")[0]}
          dy={4}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatYAxis}
          width={44}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="none"
          dot={
            fewPoints
              ? { r: 4, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }
              : { r: 3, fill: "var(--chart-1)", stroke: "var(--card)", strokeWidth: 2 }
          }
          activeDot={{
            r: 4,
            fill: "var(--chart-1)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export { RevenueTrendChart as RevenueAreaChart };
