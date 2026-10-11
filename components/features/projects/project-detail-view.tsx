"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";

import {
  ProjectWorkspace,
  type HubTab,
} from "@/components/features/projects/project-workspace";
import {
  PROJECT_TIMELINE_VIEW_STORAGE_KEY,
  PROJECTS_HUB_VIEW_STORAGE_KEY,
  projectTimelineViewCookieValue,
  projectsHubViewCookieValue,
  type ProjectsHubViewMode,
  type TimelineSubView,
} from "@/lib/projects/hub-view-preference";
import type { DigestInvoiceInput } from "@/lib/projects/digest-facts";
import type { ProfitabilityInvoice } from "@/lib/projects/project-profitability";
import type {
  DocumentListRow,
  ExpenseListRow,
  ProjectListRow,
  ProjectMilestoneRow,
  TaskRow,
  TimeEntryListRow,
} from "@/types";

type ProjectDetailViewProps = {
  project: ProjectListRow;
  tasks: TaskRow[];
  milestones: ProjectMilestoneRow[];
  timeEntries: TimeEntryListRow[];
  expenses: ExpenseListRow[];
  documents: DocumentListRow[];
  invoices: ProfitabilityInvoice[];
  digestInvoices: DigestInvoiceInput[];
  defaultCurrency: string;
  userDisplayName: string;
  initialTimelineView: TimelineSubView;
};

export function ProjectDetailView({
  project,
  tasks,
  milestones,
  timeEntries,
  expenses,
  documents,
  invoices,
  digestInvoices,
  defaultCurrency,
  userDisplayName,
  initialTimelineView,
}: ProjectDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab: HubTab =
    tabParam === "documents" ||
    tabParam === "timeline" ||
    tabParam === "time" ||
    tabParam === "expenses"
      ? tabParam
      : "tasks";

  const [viewMode, setViewMode] = useState<ProjectsHubViewMode>("list");
  const [timelineView, setTimelineView] =
    useState<TimelineSubView>(initialTimelineView);

  const setTab = useCallback(
    (tab: HubTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.push(`/projects/${project.id}?${params.toString()}`);
    },
    [router, searchParams, project.id],
  );

  function handleViewChange(mode: ProjectsHubViewMode) {
    setViewMode(mode);
    localStorage.setItem(PROJECTS_HUB_VIEW_STORAGE_KEY, mode);
    document.cookie = projectsHubViewCookieValue(mode);
  }

  function handleTimelineViewChange(view: TimelineSubView) {
    setTimelineView(view);
    localStorage.setItem(PROJECT_TIMELINE_VIEW_STORAGE_KEY, view);
    document.cookie = projectTimelineViewCookieValue(view);
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <Link
        href="/projects"
        className="inline-flex w-fit items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to projects
      </Link>

      <ProjectWorkspace
        project={project}
        projects={[project]}
        tasks={tasks}
        milestones={milestones}
        timeEntries={timeEntries}
        expenses={expenses}
        documents={documents}
        invoices={invoices}
        digestInvoices={digestInvoices}
        defaultCurrency={defaultCurrency}
        userDisplayName={userDisplayName}
        activeTab={activeTab}
        onTabChange={setTab}
        viewMode={viewMode}
        onViewModeChange={handleViewChange}
        timelineView={timelineView}
        onTimelineViewChange={handleTimelineViewChange}
      />
    </div>
  );
}
