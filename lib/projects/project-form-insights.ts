import { formatProjectDate, projectStatusLabel } from "@/lib/projects/display";
import type { ProjectCreateFormInput } from "@/lib/validations/project";

type ProjectInsightClient = {
  id: string;
  name: string;
};

type BuildProjectFormInsightsArgs = {
  values: ProjectCreateFormInput;
  clients: ProjectInsightClient[];
};

export type ProjectFormInsights = {
  title: string;
  clientLabel: string;
  statusLabel: string;
  budgetLabel: string;
  spentLabel: string;
  budgetProgressPercent: number;
  timelineLabel: string;
  missingEssentials: string[];
  nextActionLabel: string;
};

function text(value: string | number | undefined): string {
  if (value === undefined) {
    return "";
  }
  return String(value).trim();
}

function moneyNumber(value: string | number | undefined): number | null {
  const raw = text(value);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function numberLabel(value: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
  }).format(value);
}

function timelineLabel(startDate: string, deadline: string): string {
  if (startDate && deadline) {
    return `${formatProjectDate(startDate)} to ${formatProjectDate(deadline)}`;
  }
  if (startDate) {
    return `Starts ${formatProjectDate(startDate)}`;
  }
  if (deadline) {
    return `Due ${formatProjectDate(deadline)}`;
  }
  return "No timeline yet";
}

export function buildProjectFormInsights({
  values,
  clients,
}: BuildProjectFormInsightsArgs): ProjectFormInsights {
  const title = text(values.title);
  const clientId = text(values.client_id);
  const selectedClient = clients.find((client) => client.id === clientId);
  const budget = moneyNumber(values.budget);
  const spent = moneyNumber(values.spent);
  const startDate = text(values.start_date);
  const deadline = text(values.deadline);
  const hasBudgetOrTimeline = budget !== null || Boolean(startDate || deadline);

  const missingEssentials = [
    clientId ? null : "Select a client",
    title ? null : "Add a project title",
    hasBudgetOrTimeline ? null : "Add budget or timeline context",
  ].filter((item): item is string => Boolean(item));

  const budgetProgressPercent =
    budget && spent !== null ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  return {
    title: title || "Untitled project",
    clientLabel: selectedClient?.name ?? "No client selected",
    statusLabel: projectStatusLabel(values.status),
    budgetLabel: budget === null ? "No budget yet" : `${numberLabel(budget)} budget`,
    spentLabel: spent === null ? "No spend logged" : `${numberLabel(spent)} spent`,
    budgetProgressPercent,
    timelineLabel: timelineLabel(startDate, deadline),
    missingEssentials,
    nextActionLabel:
      missingEssentials.length > 0
        ? "Complete the required project basics"
        : "Save, then add project tasks",
  };
}
