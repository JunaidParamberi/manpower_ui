import { describe, expect, it } from "vitest";

import { summarizeProjectWork } from "./portfolio-summary";

const t = (id: string, status: "todo" | "in_progress" | "done" | "cancelled", extra: Partial<{ due_date: string | null; sort_order: number; parent_task_id: string | null }> = {}) => ({
  id, title: `Task ${id}`, status, due_date: null, sort_order: 0, parent_task_id: null, ...extra,
});

describe("summarizeProjectWork", () => {
  it("counts top-level tasks, excluding cancelled and subtasks", () => {
    const w = summarizeProjectWork({
      manualSpent: 0,
      tasks: [t("a", "done"), t("b", "todo"), t("c", "cancelled"), t("d", "done", { parent_task_id: "b" })],
      expenses: [],
      milestones: [],
    });
    expect(w.taskDone).toBe(1);
    expect(w.taskTotal).toBe(2);
  });

  it("picks the next open task by due date, then sort order", () => {
    const w = summarizeProjectWork({
      manualSpent: 0,
      tasks: [t("late", "todo", { due_date: "2026-10-20", sort_order: 0 }), t("soon", "in_progress", { due_date: "2026-10-10", sort_order: 5 }), t("nodate", "todo", { sort_order: 1 })],
      expenses: [],
      milestones: [],
    });
    expect(w.nextTask?.id).toBe("soon");
  });

  it("prefers linked expenses over the manual spend", () => {
    expect(summarizeProjectWork({ manualSpent: 900, tasks: [], expenses: [{ amount: 100 }, { amount: 50 }], milestones: [] }).spend).toBe(150);
    expect(summarizeProjectWork({ manualSpent: 900, tasks: [], expenses: [], milestones: [] }).spend).toBe(900);
  });

  it("returns null next task when everything is done", () => {
    expect(summarizeProjectWork({ manualSpent: 0, tasks: [t("a", "done")], expenses: [], milestones: [] }).nextTask).toBeNull();
  });

  it("maps milestones to camelCase", () => {
    expect(summarizeProjectWork({ manualSpent: 0, tasks: [], expenses: [], milestones: [{ id: "m", title: "Kickoff", due_date: "2026-10-01" }] }).milestones).toEqual([{ id: "m", title: "Kickoff", dueDate: "2026-10-01" }]);
  });
});
