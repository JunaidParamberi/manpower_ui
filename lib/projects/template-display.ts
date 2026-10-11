import type { ProjectTemplateSummaryRow } from "@/types";

export function splitProjectTemplates(templates: ProjectTemplateSummaryRow[]) {
  return {
    systemTemplates: templates.filter((t) => t.is_system),
    userTemplates: templates.filter((t) => !t.is_system),
  };
}

export function projectTemplateCountsLabel(
  milestoneCount: number,
  taskCount: number,
): string {
  const milestoneLabel =
    milestoneCount === 1 ? "1 milestone" : `${milestoneCount} milestones`;
  const taskLabel = taskCount === 1 ? "1 task" : `${taskCount} tasks`;
  return `${milestoneLabel} · ${taskLabel}`;
}
