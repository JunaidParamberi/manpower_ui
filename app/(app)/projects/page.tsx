import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";

import { ProjectsPage as ProjectsPageView, type WorkspaceData } from "@/components/features/projects/projects-page";
import { ProjectsPortfolioSkeleton } from "@/components/features/projects/skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listDocumentsForProject } from "@/lib/documents/actions";
import { listExpenses } from "@/lib/expenses/actions";
import { parseHubTab } from "@/lib/projects/display";
import {
  getProjectsHubViewModeFromCookies,
  getProjectTimelineViewFromCookies,
} from "@/lib/projects/hub-view-preference.server";
import { parseProjectsListLayout } from "@/lib/projects/list-layout-preference";
import { getProjectsListLayoutFromCookies } from "@/lib/projects/list-layout-preference.server";
import { listProjectMilestones } from "@/lib/projects/milestone-actions";
import { filterPortfolio, parseLens, selectForList, withPace } from "@/lib/projects/portfolio-filters";
import { listProjectsPortfolio } from "@/lib/projects/portfolio-queries";
import { parseZoom } from "@/lib/projects/portfolio-timeline";
import { listInvoicesWithPaymentsForProject } from "@/lib/projects/profitability-queries";
import { getProfile } from "@/lib/profile/actions";
import { listTasksForProject } from "@/lib/tasks/task-queries";
import { listTimeEntriesForProject } from "@/lib/time/actions";
import type { ProjectListRow } from "@/types";

type PageProps = {
  searchParams: Promise<{ project?: string; tab?: string; view?: string; lens?: string; q?: string; zoom?: string }>;
};

async function loadWorkspace(project: ProjectListRow): Promise<WorkspaceData> {
  const [tasksResult, milestonesResult, timeEntriesResult, expensesResult, documentsResult, invoicesResult] =
    await Promise.all([
      listTasksForProject(project.id),
      listProjectMilestones(project.id),
      listTimeEntriesForProject(project.id),
      listExpenses({ projectId: project.id }),
      listDocumentsForProject(project.id),
      listInvoicesWithPaymentsForProject(project.id),
    ]);
  return {
    project,
    tasks: tasksResult.ok ? tasksResult.tasks : [],
    milestones: milestonesResult.ok ? milestonesResult.milestones : [],
    timeEntries: timeEntriesResult.ok ? timeEntriesResult.entries : [],
    expenses: expensesResult.ok ? expensesResult.expenses : [],
    documents: documentsResult.ok ? documentsResult.documents : [],
    invoices: invoicesResult.ok ? invoicesResult.invoices : [],
    digestInvoices: invoicesResult.ok ? invoicesResult.digestInvoices : [],
  };
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [portfolio, profileResult, cookieView, taskViewMode, timelineView] = await Promise.all([
    listProjectsPortfolio(),
    getProfile(),
    getProjectsListLayoutFromCookies(),
    getProjectsHubViewModeFromCookies(),
    getProjectTimelineViewFromCookies(),
  ]);

  if (!portfolio.ok) {
    return (
      <div className="flex flex-col gap-2 px-4 py-8">
        <PageHeader title="Projects" />
        <p className="text-destructive text-sm">{portfolio.message}</p>
      </div>
    );
  }

  const projects = portfolio.projects;

  if (projects.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Projects"
          title="Projects"
          description="Manage active work and deadlines in one place."
        />
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">No projects yet</CardTitle>
            <CardDescription>
              Link work to a client, track status, and break deliverables into
              tasks—all in one place.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} render={<Link href="/projects/new" />}>
              <Plus />
              Create your first project
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const view = parseProjectsListLayout(params.view) ?? cookieView;
  const lens = parseLens(params.lens);
  const query = params.q ?? "";
  const paced = withPace(projects, today);
  const visible = filterPortfolio(paced, lens, query);
  const requested = params.project ?? null;
  const exists = requested !== null && paced.some((p) => p.id === requested);
  const selection =
    view === "list"
      ? selectForList(paced, visible, requested)
      : { id: exists ? requested : null, invalid: requested !== null && !exists };

  const selectedProject = selection.id ? projects.find((p) => p.id === selection.id) ?? null : null;
  const workspace = selectedProject ? await loadWorkspace(selectedProject) : null;

  const currency =
    profileResult.ok && profileResult.profile?.default_currency ? profileResult.profile.default_currency : "USD";
  const userDisplayName =
    profileResult.ok && profileResult.profile?.full_name ? profileResult.profile.full_name : "You";

  return (
    <Suspense fallback={<ProjectsPortfolioSkeleton view={view} />}>
      <ProjectsPageView
        projects={projects}
        today={today}
        view={view}
        lens={lens}
        query={query}
        zoom={parseZoom(params.zoom)}
        selectedId={selection.id}
        invalidSelection={selection.invalid}
        workspace={workspace}
        currency={currency}
        userDisplayName={userDisplayName}
        initialTaskViewMode={taskViewMode}
        initialTimelineView={timelineView}
        activeTab={parseHubTab(params.tab)}
      />
    </Suspense>
  );
}
