import { resolveActualSpend } from "@/lib/projects/project-rollups";
import type { ProjectListRow, TaskStatus } from "@/types";

export type PortfolioTaskInput = {
  id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  sort_order: number;
  parent_task_id: string | null;
};
export type PortfolioMilestone = { id: string; title: string; dueDate: string | null };
export type PortfolioWork = {
  taskDone: number;
  taskTotal: number;
  spend: number;
  nextTask: { id: string; title: string; dueDate: string | null } | null;
  milestones: PortfolioMilestone[];
};
export type PortfolioProject = ProjectListRow & PortfolioWork;

/** Top-level tasks only: subtasks roll up into their parent on the project page. */
export function summarizeProjectWork(args: {
  manualSpent: number;
  tasks: PortfolioTaskInput[];
  expenses: { amount: number }[];
  milestones: { id: string; title: string; due_date: string | null }[];
}): PortfolioWork {
  const top = args.tasks.filter((t) => t.parent_task_id === null && t.status !== "cancelled");
  const open = top
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      if (a.due_date && b.due_date && a.due_date !== b.due_date) return a.due_date < b.due_date ? -1 : 1;
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      return a.sort_order - b.sort_order;
    });
  const expenseTotal = args.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  return {
    taskDone: top.length - open.length,
    taskTotal: top.length,
    spend: resolveActualSpend(args.manualSpent, expenseTotal),
    nextTask: open[0] ? { id: open[0].id, title: open[0].title, dueDate: open[0].due_date } : null,
    milestones: args.milestones.map((m) => ({ id: m.id, title: m.title, dueDate: m.due_date })),
  };
}
