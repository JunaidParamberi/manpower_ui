import type { ExpenseListRow, ProjectListRow, TaskRow, TimeEntryListRow } from "@/types";

export type ProjectRollup = {
  budget: number;
  manualSpent: number;
  expenseTotal: number;
  actualSpend: number;
  budgetRemaining: number | null;
  budgetProgress: number;
  isOverBudget: boolean;
  estimatedMinutes: number;
  trackedMinutes: number;
  billedMinutes: number;
  unbilledMinutes: number;
  timeProgress: number;
};

/**
 * Linked expenses win over the manually typed `projects.spent` whenever any
 * exist. Shared with the dashboard pipeline so both surfaces report the same
 * spend for the same project.
 */
export function resolveActualSpend(manualSpent: number, expenseTotal: number): number {
  return expenseTotal > 0 ? expenseTotal : manualSpent;
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function buildProjectRollup(args: {
  project: Pick<ProjectListRow, "budget" | "spent">;
  tasks: Pick<TaskRow, "estimated_minutes">[];
  expenses: Pick<ExpenseListRow, "amount">[];
  timeEntries: Pick<TimeEntryListRow, "duration_seconds" | "billed">[];
}): ProjectRollup {
  const budget = args.project.budget ?? 0;
  const manualSpent = args.project.spent ?? 0;
  const expenseTotal = args.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const actualSpend = resolveActualSpend(manualSpent, expenseTotal);
  const budgetRemaining = budget > 0 ? budget - actualSpend : null;
  const estimatedMinutes = args.tasks.reduce(
    (sum, task) => sum + (task.estimated_minutes ?? 0),
    0,
  );
  const trackedMinutes = Math.round(
    args.timeEntries.reduce(
      (sum, entry) => sum + (entry.duration_seconds ?? 0),
      0,
    ) / 60,
  );
  const billedMinutes = Math.round(
    args.timeEntries
      .filter((entry) => entry.billed)
      .reduce((sum, entry) => sum + (entry.duration_seconds ?? 0), 0) / 60,
  );

  return {
    budget,
    manualSpent,
    expenseTotal,
    actualSpend,
    budgetRemaining,
    budgetProgress: budget > 0 ? clampProgress(actualSpend / budget) : 0,
    isOverBudget: budget > 0 && actualSpend > budget,
    estimatedMinutes,
    trackedMinutes,
    billedMinutes,
    unbilledMinutes: Math.max(0, trackedMinutes - billedMinutes),
    timeProgress:
      estimatedMinutes > 0 ? clampProgress(trackedMinutes / estimatedMinutes) : 0,
  };
}
