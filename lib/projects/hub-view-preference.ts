export const PROJECTS_HUB_VIEW_STORAGE_KEY = "manpower:projects-hub:view";
export const PROJECTS_HUB_VIEW_COOKIE = "manpower_projects_hub_view";
export const PROJECTS_HUB_VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type ProjectsHubViewMode = "list" | "board";

export function parseProjectsHubViewMode(
  value: string | null | undefined,
): ProjectsHubViewMode | null {
  if (value === "list" || value === "board") return value;
  return null;
}

export function projectsHubViewCookieValue(mode: ProjectsHubViewMode): string {
  return `${PROJECTS_HUB_VIEW_COOKIE}=${mode}; path=/; max-age=${PROJECTS_HUB_VIEW_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export type TimelineSubView = "milestones" | "gantt";

export const PROJECT_TIMELINE_VIEW_STORAGE_KEY = "manpower:project-timeline:view";
export const PROJECT_TIMELINE_VIEW_COOKIE = "manpower_project_timeline_view";
export const PROJECT_TIMELINE_VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function parseTimelineSubView(
  value: string | null | undefined,
): TimelineSubView | null {
  if (value === "milestones" || value === "gantt") return value;
  return null;
}

export function projectTimelineViewCookieValue(view: TimelineSubView): string {
  return `${PROJECT_TIMELINE_VIEW_COOKIE}=${view}; path=/; max-age=${PROJECT_TIMELINE_VIEW_COOKIE_MAX_AGE}; SameSite=Lax`;
}
