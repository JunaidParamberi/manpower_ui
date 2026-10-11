import type { TaskRow } from "@/types";

export type TaskProgressResult = {
  done: number;
  total: number;
  percent: number;
};

/**
 * Compute progress across a flat list of tasks.
 * `cancelled` tasks are excluded from both numerator and denominator.
 * `done` tasks increment the done count.
 */
export function computeTaskProgress(
  tasks: Pick<TaskRow, "status">[],
): TaskProgressResult {
  const active = tasks.filter((t) => t.status !== "cancelled");
  const done = active.filter((t) => t.status === "done").length;
  const total = active.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
}

/**
 * Compute subtask progress for a single parent task given its subtasks.
 * Cancelled subtasks are excluded.
 */
export function computeSubtaskProgress(
  subtasks: Pick<TaskRow, "status">[],
): TaskProgressResult {
  return computeTaskProgress(subtasks);
}
