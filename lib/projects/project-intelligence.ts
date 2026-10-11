import { differenceInCalendarDays, startOfDay } from "date-fns";

import { detectPaymentRisk, type DigestInvoiceInput } from "@/lib/projects/digest-facts";
import { isDueToday, isTaskOverdue } from "@/lib/tasks/task-utils";
import type { ProjectRollup } from "@/lib/projects/project-rollups";
import type { ProjectListRow, ProjectMilestoneRow, TaskRow } from "@/types";

export type WeeklyPlan = {
  overdue: TaskRow[];
  dueToday: TaskRow[];
  highPriority: TaskRow[];
  quickWins: TaskRow[];
  waitingOnClient: TaskRow[];
  upcomingMilestones: ProjectMilestoneRow[];
};

export type ProjectHealthSignalKind =
  | "deadline_risk"
  | "overdue_tasks"
  | "idle_project"
  | "over_budget"
  | "uninvoiced_time"
  | "client_visible_blockers"
  | "payment_risk";

export type ProjectHealthSignal = {
  kind: ProjectHealthSignalKind;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
};

function daysUntil(date: string | null, now: Date): number | null {
  if (!date) return null;
  return differenceInCalendarDays(
    startOfDay(new Date(`${date}T12:00:00.000Z`)),
    startOfDay(now),
  );
}

function isOpenTask(task: Pick<TaskRow, "status">): boolean {
  return task.status === "todo" || task.status === "in_progress";
}

export function buildWeeklyPlan(args: {
  tasks: TaskRow[];
  milestones: ProjectMilestoneRow[];
  now?: Date;
}): WeeklyPlan {
  const now = args.now ?? new Date();
  const openTasks = args.tasks.filter(isOpenTask);

  return {
    overdue: openTasks.filter((task) => isTaskOverdue(task, now)),
    dueToday: openTasks.filter((task) => isDueToday(task, now)),
    highPriority: openTasks.filter(
      (task) => task.priority === "high" && !task.due_date,
    ),
    quickWins: openTasks.filter(
      (task) =>
        task.estimated_minutes !== null &&
        task.estimated_minutes <= 30 &&
        task.priority !== "low",
    ),
    waitingOnClient: openTasks.filter(
      (task) =>
        task.client_visible &&
        task.labels.some((label) => label.toLowerCase().includes("client")),
    ),
    upcomingMilestones: args.milestones.filter((milestone) => {
      if (milestone.status === "completed" || milestone.status === "cancelled") {
        return false;
      }
      const days = daysUntil(milestone.due_date, now);
      return days !== null && days >= 0 && days <= 14;
    }),
  };
}

export function buildProjectHealthSignals(args: {
  project: ProjectListRow;
  tasks: TaskRow[];
  milestones: ProjectMilestoneRow[];
  rollup: ProjectRollup;
  invoices?: DigestInvoiceInput[];
  now?: Date;
}): ProjectHealthSignal[] {
  const now = args.now ?? new Date();
  const signals: ProjectHealthSignal[] = [];
  const deadlineDays = daysUntil(args.project.deadline, now);
  if (
    args.project.status === "active" &&
    deadlineDays !== null &&
    deadlineDays >= 0 &&
    deadlineDays <= 7
  ) {
    signals.push({
      kind: "deadline_risk",
      severity: deadlineDays <= 2 ? "critical" : "warning",
      title: "Deadline risk",
      detail: `${args.project.title} is due in ${deadlineDays} day${deadlineDays === 1 ? "" : "s"}.`,
    });
  }

  const overdueTasks = args.tasks.filter((task) => isTaskOverdue(task, now));
  if (overdueTasks.length > 0) {
    signals.push({
      kind: "overdue_tasks",
      severity: overdueTasks.length > 2 ? "critical" : "warning",
      title: "Overdue tasks",
      detail: `${overdueTasks.length} task${overdueTasks.length === 1 ? "" : "s"} past due.`,
    });
  }

  const latestUpdate = Math.max(
    new Date(args.project.updated_at).getTime(),
    ...args.tasks.map((task) => new Date(task.updated_at).getTime()),
  );
  const idleDays = differenceInCalendarDays(now, new Date(latestUpdate));
  if (args.project.status === "active" && idleDays >= 14) {
    signals.push({
      kind: "idle_project",
      severity: "warning",
      title: "Project looks idle",
      detail: `No project or task updates for ${idleDays} days.`,
    });
  }

  if (args.rollup.isOverBudget) {
    signals.push({
      kind: "over_budget",
      severity: "critical",
      title: "Over budget",
      detail: "Actual project spend is above the project budget.",
    });
  }

  if (args.rollup.unbilledMinutes > 0) {
    signals.push({
      kind: "uninvoiced_time",
      severity: "info",
      title: "Unbilled tracked time",
      detail: `${args.rollup.unbilledMinutes} minutes are tracked but not billed.`,
    });
  }

  const visibleBlockers = overdueTasks.filter((task) => task.client_visible);
  if (visibleBlockers.length > 0) {
    signals.push({
      kind: "client_visible_blockers",
      severity: "warning",
      title: "Client-visible blockers",
      detail: `${visibleBlockers.length} shared task${visibleBlockers.length === 1 ? "" : "s"} need attention.`,
    });
  }

  if (args.invoices && args.invoices.length > 0) {
    const paymentRisk = detectPaymentRisk(
      {
        id: args.project.id,
        title: args.project.title,
        status: args.project.status,
        deadline: args.project.deadline,
        budget: args.project.budget,
        updatedAt: args.project.updated_at,
      },
      args.invoices,
      now.toISOString(),
    );
    if (paymentRisk) {
      signals.push({
        kind: "payment_risk",
        severity: paymentRisk.severity,
        title: paymentRisk.title,
        detail: paymentRisk.detail,
      });
    }
  }

  return signals;
}
