import { describe, expect, it } from "vitest";

import { buildProjectRollup } from "@/lib/projects/project-rollups";
import type { ExpenseListRow, ProjectListRow, TaskRow, TimeEntryListRow } from "@/types";

const project = {
  id: "p1",
  budget: 1000,
  spent: 200,
} as ProjectListRow;

const taskBase: TaskRow = {
  id: "t1",
  project_id: "p1",
  title: "Task",
  status: "todo",
  due_date: null,
  priority: "medium",
  labels: [],
  description: null,
  start_date: null,
  completed_at: null,
  estimated_minutes: null,
  sort_order: 0,
  client_visible: false,
  parent_task_id: null,
  milestone_id: null,
  created_at: "2026-06-01T00:00:00Z",
  updated_at: "2026-06-01T00:00:00Z",
};

const taskOne: TaskRow = { ...taskBase, id: "t1", estimated_minutes: 120 };
const taskTwo: TaskRow = { ...taskBase, id: "t2", estimated_minutes: 60, status: "done" };

describe("buildProjectRollup", () => {
  it("derives expense spend, tracked time, and estimate totals", () => {
    const rollup = buildProjectRollup({
      project,
      tasks: [taskOne, taskTwo],
      expenses: [
        { amount: 300, currency: "USD" } as ExpenseListRow,
        { amount: 50, currency: "USD" } as ExpenseListRow,
      ],
      timeEntries: [
        { duration_seconds: 3600, billed: false } as TimeEntryListRow,
        { duration_seconds: 1800, billed: true } as TimeEntryListRow,
        { duration_seconds: null, billed: false } as TimeEntryListRow,
      ],
    });

    expect(rollup.expenseTotal).toBe(350);
    expect(rollup.manualSpent).toBe(200);
    expect(rollup.actualSpend).toBe(350);
    expect(rollup.budgetRemaining).toBe(650);
    expect(rollup.estimatedMinutes).toBe(180);
    expect(rollup.trackedMinutes).toBe(90);
    expect(rollup.unbilledMinutes).toBe(60);
    expect(rollup.timeProgress).toBe(0.5);
    expect(rollup.budgetProgress).toBe(0.35);
    expect(rollup.isOverBudget).toBe(false);
  });

  it("falls back to manual spent when no linked expenses exist", () => {
    const rollup = buildProjectRollup({
      project,
      tasks: [],
      expenses: [],
      timeEntries: [],
    });

    expect(rollup.actualSpend).toBe(200);
    expect(rollup.expenseTotal).toBe(0);
  });
});
