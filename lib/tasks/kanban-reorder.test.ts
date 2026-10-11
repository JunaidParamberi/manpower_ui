import { describe, expect, it } from "vitest";

import type { TaskRow } from "@/types";

import {
  isKanbanColumnId,
  reorderTasksInColumn,
  sortTasksByColumnOrder,
} from "./kanban-reorder";

function task(id: string, status: TaskRow["status"], sort_order: number): TaskRow {
  return {
    id,
    project_id: "p1",
    title: id,
    status,
    due_date: null,
    priority: "medium",
    labels: [],
    description: null,
    start_date: null,
    completed_at: null,
    estimated_minutes: null,
    sort_order,
    client_visible: false,
    parent_task_id: null,
    milestone_id: null,
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
  };
}

describe("isKanbanColumnId", () => {
  it("accepts kanban column ids", () => {
    expect(isKanbanColumnId("todo")).toBe(true);
    expect(isKanbanColumnId("in_progress")).toBe(true);
  });

  it("rejects task ids", () => {
    expect(isKanbanColumnId("task-1")).toBe(false);
  });
});

describe("sortTasksByColumnOrder", () => {
  it("orders by sort_order then created_at", () => {
    const ordered = sortTasksByColumnOrder([
      task("b", "todo", 1),
      task("a", "todo", 0),
    ]);
    expect(ordered.map((item) => item.id)).toEqual(["a", "b"]);
  });
});

describe("reorderTasksInColumn", () => {
  it("moves a task within the same status column", () => {
    const tasks = [task("a", "todo", 0), task("b", "todo", 1), task("c", "done", 0)];
    const result = reorderTasksInColumn(tasks, "a", "b");
    expect(result).not.toBeNull();
    expect(result?.nextTasks.find((item) => item.id === "a")?.sort_order).toBe(1);
    expect(result?.nextTasks.find((item) => item.id === "b")?.sort_order).toBe(0);
    expect(result?.updates).toEqual([
      { projectId: "p1", taskId: "b", sort_order: 0 },
      { projectId: "p1", taskId: "a", sort_order: 1 },
    ]);
  });

  it("returns null for cross-column drops", () => {
    const tasks = [task("a", "todo", 0), task("b", "in_progress", 0)];
    expect(reorderTasksInColumn(tasks, "a", "b")).toBeNull();
  });
});
