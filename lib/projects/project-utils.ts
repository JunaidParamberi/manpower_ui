import { differenceInCalendarDays } from "date-fns";

import type { ProjectListRow } from "@/types";

export function isProjectAtRisk(
  project: Pick<ProjectListRow, "status" | "deadline">,
): boolean {
  if (project.status !== "active" || !project.deadline?.trim()) {
    return false;
  }
  const days = differenceInCalendarDays(
    new Date(`${project.deadline.trim()}T12:00:00.000Z`),
    new Date(),
  );
  return days <= 7;
}

export type ProjectChipRisk = "danger" | "warning" | "success";

export function getProjectChipRisk(
  project: Pick<ProjectListRow, "status" | "deadline">,
): ProjectChipRisk {
  if (isProjectAtRisk(project)) {
    return "danger";
  }
  if (project.status === "on_hold") {
    return "warning";
  }
  if (project.deadline?.trim() && project.status === "active") {
    const days = differenceInCalendarDays(
      new Date(`${project.deadline.trim()}T12:00:00.000Z`),
      new Date(),
    );
    if (days >= 0 && days <= 14) {
      return "warning";
    }
  }
  return "success";
}

export function projectBudgetProgress(
  project: Pick<ProjectListRow, "budget" | "spent">,
): number {
  const budget = project.budget ?? 0;
  if (budget <= 0) {
    return 0;
  }
  const spent = project.spent ?? 0;
  return Math.min(1, Math.max(0, spent / budget));
}
