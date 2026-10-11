import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";

import { isDueToday, isTaskOverdue } from "@/lib/tasks/task-utils";
import type { TaskPriority, TaskStatus } from "@/types";

export function taskPriorityLabel(p: TaskPriority): string {
  switch (p) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return p;
  }
}

export function taskPriorityStatusKey(priority: TaskPriority): string {
  if (priority === "high") return "high";
  if (priority === "medium") return "med";
  return "low";
}

export type TaskDueDisplay = {
  label: string;
  className: string;
};

/** Human due label with tone for table cells (Today, Tomorrow, overdue, date). */
export function formatTaskDueDisplay(
  task: { due_date: string | null; status: TaskStatus },
  now = new Date(),
): TaskDueDisplay {
  if (!task.due_date?.trim()) {
    return { label: "—", className: "text-muted-foreground" };
  }

  if (isDueToday(task, now)) {
    return {
      label: "Today",
      className: "font-medium text-[var(--warning)]",
    };
  }

  if (isTaskOverdue(task, now)) {
    const d = parseISO(
      task.due_date.length === 10
        ? `${task.due_date}T12:00:00.000Z`
        : task.due_date,
    );
    const formatted = Number.isNaN(d.getTime())
      ? task.due_date
      : new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
        }).format(d);
    return {
      label: formatted,
      className: "font-medium text-[var(--danger)]",
    };
  }

  const due = startOfDay(
    parseISO(
      task.due_date.length === 10
        ? `${task.due_date}T12:00:00.000Z`
        : task.due_date,
    ),
  );
  const today = startOfDay(now);
  const days = differenceInCalendarDays(due, today);
  if (days === 1) {
    return {
      label: "Tomorrow",
      className: "text-muted-foreground",
    };
  }

  const formatted = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(due);
  return { label: formatted, className: "text-muted-foreground" };
}
