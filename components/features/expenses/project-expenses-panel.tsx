"use client";

import { ExpensesView } from "@/components/features/expenses/expenses-view";
import type { ExpenseListRow, ProjectListRow } from "@/types";

type ProjectExpensesPanelProps = {
  projectId: string;
  expenses: ExpenseListRow[];
  projects: ProjectListRow[];
  defaultCurrency: string;
};

export function ProjectExpensesPanel({
  projectId,
  expenses,
  projects,
  defaultCurrency,
}: ProjectExpensesPanelProps) {
  return (
    <ExpensesView
      expenses={expenses}
      projects={projects}
      defaultCurrency={defaultCurrency}
      lockProjectId={projectId}
      showProjectColumn={false}
      title="Project expenses"
      description="Spending linked to this project."
    />
  );
}
