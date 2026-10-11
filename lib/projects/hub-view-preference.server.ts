import { cookies } from "next/headers";

import {
  PROJECT_TIMELINE_VIEW_COOKIE,
  PROJECTS_HUB_VIEW_COOKIE,
  parseProjectsHubViewMode,
  parseTimelineSubView,
  type ProjectsHubViewMode,
  type TimelineSubView,
} from "@/lib/projects/hub-view-preference";

export async function getProjectsHubViewModeFromCookies(): Promise<ProjectsHubViewMode> {
  const cookieStore = await cookies();
  return (
    parseProjectsHubViewMode(cookieStore.get(PROJECTS_HUB_VIEW_COOKIE)?.value) ??
    "board"
  );
}

export async function getProjectTimelineViewFromCookies(): Promise<TimelineSubView> {
  const cookieStore = await cookies();
  return (
    parseTimelineSubView(cookieStore.get(PROJECT_TIMELINE_VIEW_COOKIE)?.value) ??
    "milestones"
  );
}
