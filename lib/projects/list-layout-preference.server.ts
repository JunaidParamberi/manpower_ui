import { cookies } from "next/headers";

import {
  PROJECTS_LIST_LAYOUT_COOKIE,
  parseProjectsListLayout,
  type ProjectsListLayout,
} from "@/lib/projects/list-layout-preference";

export async function getProjectsListLayoutFromCookies(): Promise<ProjectsListLayout> {
  const cookieStore = await cookies();
  return (
    parseProjectsListLayout(
      cookieStore.get(PROJECTS_LIST_LAYOUT_COOKIE)?.value,
    ) ?? "list"
  );
}
