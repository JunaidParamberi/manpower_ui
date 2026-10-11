import type { ProjectListRow } from "@/types";

/** Select sentinel for optional task (empty string is unreliable in some Select implementations). */
export const TASK_SELECT_NONE = "__none__";

export function formatProjectOptionLabel(p: ProjectListRow): string {
  const c = p.client?.name?.trim();
  return c ? `${c} — ${p.title}` : p.title;
}

/**
 * Label shown in project Select triggers — never exposes raw UUIDs when the id is missing from `projects`.
 */
export function resolveProjectTriggerLabel(
  projectId: string,
  projects: ProjectListRow[],
  emptyLabel = "Select project",
): string {
  const id = projectId.trim();
  if (!id) {
    return emptyLabel;
  }
  const p = projects.find((x) => x.id === id);
  return p ? formatProjectOptionLabel(p) : "Unknown project";
}

export function taskIdFromForm(raw: string): string {
  return raw === TASK_SELECT_NONE ? "" : raw;
}

/**
 * Combines `YYYY-MM-DD` + `HH:mm` (local) into UTC ISO for parsers / Supabase.
 */
export function combineLocalDateAndTime(
  dateYmd: string,
  timeHm: string,
): string | null {
  const d = dateYmd.trim();
  if (!d) {
    return null;
  }
  const t = timeHm.trim() || "00:00";
  const composed = `${d}T${t}`;
  const parsed = new Date(composed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}
