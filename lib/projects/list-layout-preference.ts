export const PROJECTS_LIST_LAYOUT_STORAGE_KEY =
  "manpower:projects:list-layout";
export const PROJECTS_LIST_LAYOUT_COOKIE = "manpower_projects_list_layout";
export const PROJECTS_LIST_LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type ProjectsListLayout = "list" | "board" | "timeline";

export function parseProjectsListLayout(
  value: string | null | undefined,
): ProjectsListLayout | null {
  if (value === "list" || value === "board" || value === "timeline") return value;
  // Retired layouts from the Hub/Table page.
  if (value === "hub" || value === "table") return "list";
  return null;
}

export function projectsListLayoutCookieValue(
  layout: ProjectsListLayout,
): string {
  return `${PROJECTS_LIST_LAYOUT_COOKIE}=${layout}; path=/; max-age=${PROJECTS_LIST_LAYOUT_COOKIE_MAX_AGE}; SameSite=Lax`;
}
