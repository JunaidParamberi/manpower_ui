import { Clock, ReceiptText, WalletCards } from "lucide-react";

import { buildProjectRollup } from "@/lib/projects/project-rollups";
import { formatCurrency } from "@/lib/utils/format";
import type {
  ExpenseListRow,
  ProjectListRow,
  TaskRow,
  TimeEntryListRow,
} from "@/types";

type ProjectTimeRollupPanelProps = {
  project: ProjectListRow;
  tasks: TaskRow[];
  expenses: ExpenseListRow[];
  timeEntries: TimeEntryListRow[];
  currency: string;
};

function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h`;
}

export function ProjectTimeRollupPanel({
  project,
  tasks,
  expenses,
  timeEntries,
  currency,
}: ProjectTimeRollupPanelProps) {
  const rollup = buildProjectRollup({ project, tasks, expenses, timeEntries });

  const cards = [
    {
      label: "Budget used",
      value: formatCurrency(rollup.actualSpend, currency),
      helper:
        rollup.budget > 0
          ? `${Math.round(rollup.budgetProgress * 100)}% of ${formatCurrency(
              rollup.budget,
              currency,
            )}`
          : "No project budget set",
      icon: WalletCards,
      tone: rollup.isOverBudget ? "text-destructive" : "text-foreground",
    },
    {
      label: "Tracked time",
      value: formatHours(rollup.trackedMinutes),
      helper:
        rollup.estimatedMinutes > 0
          ? `${Math.round(rollup.timeProgress * 100)}% of ${formatHours(
              rollup.estimatedMinutes,
            )} estimated`
          : "No task estimates yet",
      icon: Clock,
      tone: "text-foreground",
    },
    {
      label: "Unbilled time",
      value: formatHours(rollup.unbilledMinutes),
      helper: `${formatHours(rollup.billedMinutes)} already billed`,
      icon: ReceiptText,
      tone: rollup.unbilledMinutes > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground",
    },
  ];

  return (
    <div className="grid gap-4 @xl/shell:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.label}
            className="rounded-xl border border-border bg-card p-4 shadow-xs"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="size-4" />
              {card.label}
            </div>
            <p className={`mt-3 text-2xl font-semibold tabular-nums ${card.tone}`}>
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.helper}</p>
          </article>
        );
      })}
    </div>
  );
}
