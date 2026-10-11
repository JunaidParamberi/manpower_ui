import {
  ArrowDownLeft,
  CircleDollarSign,
  Clock,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import {
  buildProjectProfitability,
  type ProfitabilityInvoice,
} from "@/lib/projects/project-profitability";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { ExpenseListRow, ProjectListRow, TimeEntryListRow } from "@/types";

type ProjectProfitabilityPanelProps = {
  project: Pick<ProjectListRow, "hourly_rate">;
  invoices: ProfitabilityInvoice[];
  expenses: Pick<ExpenseListRow, "amount">[];
  timeEntries: Pick<TimeEntryListRow, "duration_seconds" | "billed">[];
  currency: string;
};

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h`;
}

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  icon: React.ElementType;
  tone?: string;
};

function MetricCard({ label, value, helper, icon: Icon, tone }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <p className={cn("mt-3 text-2xl font-semibold tabular-nums", tone ?? "text-foreground")}>
        {value}
      </p>
      {helper ? (
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </article>
  );
}

export function ProjectProfitabilityPanel({
  project,
  invoices,
  expenses,
  timeEntries,
  currency,
}: ProjectProfitabilityPanelProps) {
  const prof = buildProjectProfitability({
    invoices,
    expenses,
    timeEntries,
    hourlyRate: project.hourly_rate,
  });

  const isNegativeMargin = prof.margin < 0;

  const cards: MetricCardProps[] = [
    {
      label: "Collected",
      value: formatCurrency(prof.collectedTotal, currency),
      helper:
        prof.invoicedTotal > 0
          ? `of ${formatCurrency(prof.invoicedTotal, currency)} invoiced`
          : "No invoices yet",
      icon: CircleDollarSign,
      tone: "text-foreground",
    },
    {
      label: "Outstanding",
      value: formatCurrency(prof.outstandingTotal, currency),
      helper: prof.expenseCost > 0
        ? `${formatCurrency(prof.expenseCost, currency)} in expenses`
        : "No recorded expenses",
      icon: ArrowDownLeft,
      tone:
        prof.outstandingTotal > 0
          ? "text-amber-600 dark:text-amber-400"
          : "text-foreground",
    },
    {
      label: "Margin",
      value: formatCurrency(prof.margin, currency),
      helper: "Collected minus expenses",
      icon: isNegativeMargin ? TriangleAlert : TrendingUp,
      tone: isNegativeMargin
        ? "text-destructive"
        : prof.margin > 0
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-foreground",
    },
    {
      label: "Unbilled time value",
      value:
        project.hourly_rate && project.hourly_rate > 0
          ? formatCurrency(prof.unbilledTimeValue, currency)
          : formatHours(prof.unbilledMinutes),
      helper:
        project.hourly_rate && project.hourly_rate > 0
          ? `${formatHours(prof.unbilledMinutes)} × ${formatCurrency(project.hourly_rate, currency)}/h`
          : "Set a project hourly rate to see value",
      icon: Clock,
      tone:
        prof.unbilledMinutes > 0
          ? "text-amber-600 dark:text-amber-400"
          : "text-foreground",
    },
  ];

  if (prof.effectiveHourlyRate !== null) {
    cards.push({
      label: "Effective rate",
      value: `${formatCurrency(prof.effectiveHourlyRate, currency)}/h`,
      helper: `Based on ${formatHours(prof.trackedMinutes)} tracked`,
      icon: TrendingUp,
      tone: "text-foreground",
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Profitability</h3>
      <div className="grid gap-4 @sm/shell:grid-cols-2 @3xl/shell:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  );
}
