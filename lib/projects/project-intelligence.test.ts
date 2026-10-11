import { describe, expect, it, vi } from "vitest";

import {
  buildProjectHealthSignals,
  buildWeeklyPlan,
} from "@/lib/projects/project-intelligence";
import type { ProjectListRow, ProjectMilestoneRow, TaskRow } from "@/types";

const project = {
  id: "p1",
  title: "Website redesign",
  status: "active",
  deadline: "2026-06-08",
  budget: 1000,
  spent: 1200,
  client: { id: "c1", name: "Acme" },
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
  created_at: "2026-06-01T10:00:00Z",
  updated_at: "2026-06-01T10:00:00Z",
};

const baseRollup = {
  budget: 1000,
  manualSpent: 0,
  expenseTotal: 0,
  actualSpend: 0,
  budgetRemaining: 1000,
  budgetProgress: 0,
  isOverBudget: false,
  estimatedMinutes: 0,
  trackedMinutes: 0,
  billedMinutes: 0,
  unbilledMinutes: 0,
  timeProgress: 0,
};

const milestone: ProjectMilestoneRow = {
  id: "m1",
  project_id: "p1",
  title: "Design approval",
  description: null,
  status: "upcoming",
  due_date: "2026-06-05",
  sort_order: 0,
  client_visible: true,
  created_at: "2026-06-01T10:00:00Z",
  updated_at: "2026-06-01T10:00:00Z",
};

describe("project intelligence foundation", () => {
  it("builds deterministic weekly planning buckets", () => {
    vi.setSystemTime(new Date("2026-06-02T10:00:00Z"));
    const plan = buildWeeklyPlan({
      tasks: [
        { ...taskBase, id: "overdue", title: "Overdue", due_date: "2026-06-01" },
        { ...taskBase, id: "today", title: "Today", due_date: "2026-06-02" },
        { ...taskBase, id: "high", title: "High", priority: "high" },
      ],
      milestones: [milestone],
      now: new Date(),
    });

    expect(plan.overdue.map((task) => task.id)).toEqual(["overdue"]);
    expect(plan.dueToday.map((task) => task.id)).toEqual(["today"]);
    expect(plan.highPriority.map((task) => task.id)).toEqual(["high"]);
    expect(plan.upcomingMilestones.map((item) => item.id)).toEqual(["m1"]);
    vi.useRealTimers();
  });

  it("builds AI-ready health signals without AI calls", () => {
    const signals = buildProjectHealthSignals({
      project,
      tasks: [{ ...taskBase, due_date: "2026-06-01", client_visible: true }],
      milestones: [milestone],
      rollup: {
        budget: 1000,
        manualSpent: 1200,
        expenseTotal: 1200,
        actualSpend: 1200,
        budgetRemaining: -200,
        budgetProgress: 1,
        isOverBudget: true,
        estimatedMinutes: 120,
        trackedMinutes: 30,
        billedMinutes: 0,
        unbilledMinutes: 30,
        timeProgress: 0.25,
      },
      now: new Date("2026-06-02T10:00:00Z"),
    });

    expect(signals.map((signal) => signal.kind)).toEqual([
      "deadline_risk",
      "overdue_tasks",
      "over_budget",
      "uninvoiced_time",
      "client_visible_blockers",
    ]);
  });
});

describe("buildProjectHealthSignals payment risk", () => {
  it("emits a payment_risk signal when overdue invoices are passed", () => {
    const signals = buildProjectHealthSignals({
      project,
      tasks: [],
      milestones: [],
      rollup: baseRollup,
      invoices: [
        {
          id: "i1",
          projectId: project.id,
          status: "sent",
          dueDate: "2026-06-01",
          total: 900,
        },
      ],
      now: new Date("2026-07-28T09:00:00.000Z"),
    });

    expect(signals.map((s) => s.kind)).toContain("payment_risk");
  });

  it("emits no payment_risk signal when invoices are omitted", () => {
    const signals = buildProjectHealthSignals({
      project,
      tasks: [],
      milestones: [],
      rollup: baseRollup,
      now: new Date("2026-07-28T09:00:00.000Z"),
    });

    expect(signals.map((s) => s.kind)).not.toContain("payment_risk");
  });
});
