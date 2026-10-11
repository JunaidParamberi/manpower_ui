import type { Metadata } from "next";

import { TasksView } from "@/components/features/tasks/tasks-view";
import { listAllMilestonesForUser } from "@/lib/projects/milestone-actions";
import { listProjects } from "@/lib/projects/actions";
import { listAllTasksForUser } from "@/lib/tasks/task-queries";
import { PageHeader } from "@/components/shared/page-header";
import {
  parseTaskListFilters,
  parseTaskRouteViewMode,
} from "@/lib/tasks/task-utils";

export const metadata: Metadata = { title: "Tasks" };

type SearchParams = Promise<{
  project?: string;
  status?: string;
  priority?: string;
  sort?: string;
  view?: string;
  mode?: string;
}>;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const initialFilters = parseTaskListFilters(params);
  const initialViewMode = parseTaskRouteViewMode(params.mode);

  const [tasksResult, projectsResult, milestonesResult] = await Promise.all([
    listAllTasksForUser(),
    listProjects(),
    listAllMilestonesForUser(),
  ]);

  if (!tasksResult.ok) {
    return (
      <div className="flex flex-col gap-2">
        <PageHeader title="Tasks" />
        <p className="text-destructive text-sm">{tasksResult.message}</p>
      </div>
    );
  }

  const projects = projectsResult.ok ? projectsResult.projects : [];
  const milestones = milestonesResult.ok ? milestonesResult.milestones : [];

  return (
    <TasksView
      tasks={tasksResult.tasks}
      projects={projects}
      milestones={milestones}
      initialFilters={initialFilters}
      initialViewMode={initialViewMode}
    />
  );
}
