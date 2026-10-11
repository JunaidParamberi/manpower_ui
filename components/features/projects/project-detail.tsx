import { notFound } from "next/navigation";

import { ProjectDetailView } from "@/components/features/projects/project-detail-view";
import { listDocumentsForProject } from "@/lib/documents/actions";
import { listExpenses } from "@/lib/expenses/actions";
import { getProjectById } from "@/lib/projects/actions";
import { getProjectTimelineViewFromCookies } from "@/lib/projects/hub-view-preference.server";
import { listProjectMilestones } from "@/lib/projects/milestone-actions";
import { listInvoicesWithPaymentsForProject } from "@/lib/projects/profitability-queries";
import { getProfile } from "@/lib/profile/actions";
import { listTasksForProject } from "@/lib/tasks/task-queries";
import { listTimeEntriesForProject } from "@/lib/time/actions";

export async function ProjectDetail({ id }: { id: string }) {
  const project = await getProjectById(id);
  if (!project) {
    notFound();
  }

  const [
    tasksResult,
    milestonesResult,
    timeEntriesResult,
    expensesResult,
    documentsResult,
    invoicesResult,
    profileResult,
  ] = await Promise.all([
    listTasksForProject(project.id),
    listProjectMilestones(project.id),
    listTimeEntriesForProject(project.id),
    listExpenses({ projectId: project.id }),
    listDocumentsForProject(project.id),
    listInvoicesWithPaymentsForProject(project.id),
    getProfile(),
  ]);

  const tasks = tasksResult.ok ? tasksResult.tasks : [];
  const milestones = milestonesResult.ok ? milestonesResult.milestones : [];
  const timeEntries = timeEntriesResult.ok ? timeEntriesResult.entries : [];
  const expenses = expensesResult.ok ? expensesResult.expenses : [];
  const documents = documentsResult.ok ? documentsResult.documents : [];
  const invoices = invoicesResult.ok ? invoicesResult.invoices : [];
  const digestInvoices = invoicesResult.ok ? invoicesResult.digestInvoices : [];
  const defaultCurrency =
    profileResult.ok && profileResult.profile?.default_currency
      ? profileResult.profile.default_currency
      : "USD";
  const userDisplayName =
    profileResult.ok && profileResult.profile?.full_name
      ? profileResult.profile.full_name
      : "You";
  const initialTimelineView = await getProjectTimelineViewFromCookies();

  return (
    <ProjectDetailView
      project={project}
      tasks={tasks}
      milestones={milestones}
      timeEntries={timeEntries}
      expenses={expenses}
      documents={documents}
      invoices={invoices}
      digestInvoices={digestInvoices}
      defaultCurrency={defaultCurrency}
      userDisplayName={userDisplayName}
      initialTimelineView={initialTimelineView}
    />
  );
}
