import type { ProjectStatus } from "@/types";

/** Wireframe-aligned labels for DB statuses. */
export function projectStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case "planning":
      return "Pending";
    case "active":
      return "In progress";
    case "on_hold":
      return "Review";
    case "completed":
      return "Completed";
    case "archived":
      return "Archived";
    default:
      return status;
  }
}

/** Tab filters on the projects list (maps to one or more DB statuses). */
export type ProjectListFilterTab = "all" | "in_progress" | "review" | "completed";

export const PROJECT_LIST_FILTER_TABS: {
  value: ProjectListFilterTab;
  label: string;
}[] = [
  { value: "all", label: "All projects" },
  { value: "in_progress", label: "In progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
];

export function projectMatchesListFilter(
  status: ProjectStatus,
  tab: ProjectListFilterTab,
): boolean {
  if (tab === "all") {
    return true;
  }
  if (tab === "in_progress") {
    return status === "active" || status === "planning";
  }
  if (tab === "review") {
    return status === "on_hold";
  }
  if (tab === "completed") {
    return status === "completed" || status === "archived";
  }
  return true;
}

const deadlineFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Format `YYYY-MM-DD` or ISO date string for tables; null-safe. */
export function formatProjectDate(isoDate: string | null): string {
  if (!isoDate?.trim()) {
    return "—";
  }
  const d = new Date(`${isoDate.trim()}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return deadlineFormatter.format(d);
}

const HUB_TABS = ["tasks", "timeline", "documents", "time", "expenses"] as const;
export type ProjectHubTab = (typeof HUB_TABS)[number];

/** `?tab=` for the project workspace; anything unknown falls back to Tasks. */
export function parseHubTab(value: string | null | undefined): ProjectHubTab {
  return (HUB_TABS as readonly string[]).includes(value ?? "") ? (value as ProjectHubTab) : "tasks";
}
