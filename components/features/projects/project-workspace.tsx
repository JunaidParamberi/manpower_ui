"use client";

import { NewDocumentButton } from "@/components/features/documents/workspace/new-document-button";
import { createPortal } from "react-dom";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";

import { projectHelpFromData } from "@/lib/kraft/record-help";

import { ProjectExpensesPanel } from "@/components/features/expenses/project-expenses-panel";
import { DocumentsTable } from "@/components/features/documents/documents-table";
import {
  ProjectTasksPanel,
  type ProjectTaskFilters,
} from "@/components/features/projects/project-tasks-panel";
import { ProjectTimelinePanel } from "@/components/features/projects/project-timeline-panel";
import { ProjectGanttPanel } from "@/components/features/projects/project-gantt-panel";
import { ProjectTimeRollupPanel } from "@/components/features/projects/project-time-rollup-panel";
import { ProjectProfitabilityPanel } from "@/components/features/projects/project-profitability-panel";
import type { DigestInvoiceInput } from "@/lib/projects/digest-facts";
import type { ProfitabilityInvoice } from "@/lib/projects/project-profitability";
import { ProjectHealthSignals } from "@/components/features/projects/project-health-signals";
import { ProjectSummaryCard } from "@/components/features/projects/project-summary-card";
import { ProjectKraftNudge } from "@/components/features/projects/project-kraft-nudge";
import { ProjectPaceCard } from "@/components/features/projects/project-pace-card";
import { ProjectFocusHeader } from "@/components/features/projects/project-focus-header";
import { cn } from "@/lib/utils";
import { ProjectTaskChecklist } from "@/components/features/projects/project-task-checklist";
import { TaskViewSwitch } from "@/components/features/projects/task-view-switch";
import type { Pace } from "@/lib/projects/project-pace";
import { resolveActualSpend } from "@/lib/projects/project-rollups";
import { formatShortDate } from "@/lib/utils/format";
import type {
  ProjectsHubViewMode,
  TimelineSubView,
} from "@/lib/projects/hub-view-preference";
import {
  ProjectTasksKanbanSkeleton,
  ProjectTasksListSkeleton,
} from "@/components/features/projects/project-tasks-skeletons";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import type {
  DocumentListRow,
  ExpenseListRow,
  ProjectListRow,
  ProjectMilestoneRow,
  TaskRow,
  TimeEntryListRow,
} from "@/types";

import { Skeleton } from "@/components/shared/skeletons";
import { ProjectFocusSkeleton } from "@/components/features/projects/skeletons";
import { Button } from "@/components/ui/button";

export type HubTab = "tasks" | "timeline" | "documents" | "time" | "expenses";

const TABS: { id: HubTab; label: string }[] = [
  { id: "tasks", label: "Tasks" },
  { id: "timeline", label: "Timeline" },
  { id: "documents", label: "Documents" },
  { id: "time", label: "Time" },
  { id: "expenses", label: "Expenses" },
];

type ProjectWorkspaceProps = {
  project: ProjectListRow;
  projects: ProjectListRow[];
  tasks: TaskRow[];
  milestones: ProjectMilestoneRow[];
  timeEntries: TimeEntryListRow[];
  expenses: ExpenseListRow[];
  documents: DocumentListRow[];
  invoices: ProfitabilityInvoice[];
  digestInvoices: DigestInvoiceInput[];
  defaultCurrency: string;
  userDisplayName: string;
  activeTab: HubTab;
  onTabChange: (tab: HubTab) => void;
  viewMode: ProjectsHubViewMode;
  onViewModeChange: (mode: ProjectsHubViewMode) => void;
  timelineView: TimelineSubView;
  onTimelineViewChange: (view: TimelineSubView) => void;
  isPending?: boolean;
  /** Show Kraft's help button on the summary card (off in stories without the AI panel). */
  showKraft?: boolean;
  /**
   * `summary` (project page): the summary card + health signals.
   * `focus` (projects page / peek): title header, pace card and Kraft nudge.
   */
  variant?: "summary" | "focus";
  /** Required for `variant="focus"`. */
  pace?: Pace;
  /** Header actions in focus mode (hidden in the peek). */
  focusActions?: React.ReactNode;
  /** Render the focus header here (default) or leave it to the page, which pins it above a scrolling body. */
  focusHeader?: boolean;
};

export function ProjectWorkspace({
  project,
  projects,
  tasks,
  milestones,
  timeEntries,
  expenses,
  documents,
  invoices,
  digestInvoices,
  defaultCurrency,
  userDisplayName,
  activeTab,
  onTabChange,
  viewMode,
  onViewModeChange,
  timelineView,
  onTimelineViewChange,
  isPending = false,
  showKraft = true,
  variant = "summary",
  pace,
  focusActions,
  focusHeader = true,
}: ProjectWorkspaceProps) {
  // Kraft's button: the nightly digest's risk signals, for this project.
  const kraftHelp = useMemo(
    () =>
      showKraft
        ? projectHelpFromData({
            project,
            tasks,
            expenses,
            invoices: digestInvoices,
            nowIso: new Date().toISOString(),
            currency: defaultCurrency,
          })
        : null,
    [showKraft, project, tasks, expenses, digestInvoices, defaultCurrency],
  );
  const [tabActions, setTabActions] = useState<HTMLDivElement | null>(null);
  const [taskFilters, setTaskFilters] = useState<ProjectTaskFilters>({
    status: "all",
    priority: "all",
    sortBy: "due",
  });

  function tabCount(tab: HubTab): string | number | null {
    switch (tab) {
      case "tasks":
        return tasks.length;
      case "timeline":
        return milestones.length;
      case "documents":
        return documents.length;
      case "time":
        return null;
      case "expenses":
        return expenses.length;
      default:
        return null;
    }
  }


  // Switching projects on the projects page: one skeleton shaped like the
  // focus workspace, not the summary card + task-board skeletons below.
  if (variant === "focus" && isPending) return <ProjectFocusSkeleton withHeader={focusHeader} delayed />;

  return (
    <>
      {variant === "focus" && pace ? (
        <>
          {focusHeader ? (
            <ProjectFocusHeader project={project} pace={pace} kraftHelp={kraftHelp} actions={focusActions} />
          ) : null}
          <ProjectPaceCard
            pace={pace}
            startLabel={project.start_date ? `Start ${formatShortDate(project.start_date)}` : "Start"}
            dueLabel={project.deadline ? formatShortDate(project.deadline) : null}
            facts={{
              taskDone: tasks.filter((t) => t.parent_task_id === null && t.status === "done").length,
              taskTotal: tasks.filter((t) => t.parent_task_id === null && t.status !== "cancelled").length,
              loggedHours: Math.round(timeEntries.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0) / 360) / 10,
              spend: resolveActualSpend(
                Number(project.spent ?? 0),
                expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
              ),
              budget: project.budget,
              currency: defaultCurrency,
            }}
          />
          <ProjectKraftNudge pace={pace} clientName={project.client?.name ?? null} projectTitle={project.title} />
        </>
      ) : (
        <>
          {isPending ? (
            <div
              className="rounded-xl border border-border bg-card p-5 shadow-xs"
              aria-busy="true"
              aria-label="Loading project"
            >
              <Skeleton w="60%" h={22} r={5} />
              <Skeleton w="40%" h={14} r={4} className="mt-3" />
            </div>
          ) : (
            <ProjectSummaryCard
              project={project}
              milestones={milestones}
              tasks={tasks}
              expenses={expenses}
              currency={defaultCurrency}
              userDisplayName={userDisplayName}
              kraftHelp={kraftHelp}
            />
          )}
        </>
      )}

      {variant === "summary" ? (
        <>
          {!isPending ? (
            <ProjectHealthSignals
              project={project}
              tasks={tasks}
              milestones={milestones}
              expenses={expenses}
              timeEntries={timeEntries}
              invoices={digestInvoices}
            />
          ) : null}
        </>
      ) : null}

      {variant === "focus" ? (
        <div className="mt-1 -mb-1 flex min-w-0 items-center justify-between gap-3 shadow-[inset_0_-1px_0_var(--border)]">
        <nav aria-label="Project sections" className="scroll-x flex min-w-0 gap-0.5 [&>button:first-child]:ps-0 [&>button:first-child]:after:start-0">
          {TABS.map((t) => {
            const count = tabCount(t.id);
            const on = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-current={on ? "page" : undefined}
                onClick={() => onTabChange(t.id)}
                className={cn(
                  "relative h-[34px] shrink-0 border-0 bg-transparent px-2.5 text-body font-medium whitespace-nowrap",
                  on
                    ? "text-foreground after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground"
                    : "text-[var(--fg-3)] hover:text-foreground",
                )}
              >
                {t.label}
                {count ? <span className="ms-1.5 text-label font-normal text-[var(--fg-3)]">{count}</span> : null}
              </button>
            );
          })}
        </nav>
          {/* Tab-specific actions (task view switch, filter, add) land here. */}
          <div ref={setTabActions} className="flex shrink-0 items-center gap-1.5 py-1" />
        </div>
      ) : (
      <nav className="tabs fade-up delay-3" aria-label="Project sections">
        {TABS.map((t) => {
          const count = tabCount(t.id);
          return (
            <button
              key={t.id}
              type="button"
              className="tabs__item"
              data-active={activeTab === t.id ? "true" : undefined}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
              {count != null ? <span className="tabs__count">{count}</span> : null}
            </button>
          );
        })}
      </nav>
      )}

      {isPending ? (
        activeTab === "tasks" ? (
          viewMode === "list" ? (
            <ProjectTasksListSkeleton />
          ) : (
            <ProjectTasksKanbanSkeleton />
          )
        ) : (
          <div
            className="rounded-xl border border-border bg-card p-6 shadow-xs"
            aria-busy="true"
          >
            <Skeleton w="40%" h={16} r={4} />
            <Skeleton w="100%" h={120} r={8} className="mt-4" />
          </div>
        )
      ) : activeTab === "tasks" && variant === "focus" && viewMode === "list" ? (
        <div className="flex flex-col gap-2">
          {tabActions ? createPortal(<TaskViewSwitch value={viewMode} onChange={onViewModeChange} />, tabActions) : null}
          <ProjectTaskChecklist projectId={project.id} tasks={tasks} today={new Date().toISOString().slice(0, 10)} />
        </div>
      ) : activeTab === "tasks" ? (
        <ProjectTasksPanel
          toolbarTarget={variant === "focus" ? tabActions : undefined}
          projectId={project.id}
          initialTasks={tasks}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          filters={taskFilters}
          onFiltersChange={setTaskFilters}
        />
      ) : null}

      {!isPending && activeTab === "timeline" ? (
        <div className="flex flex-col gap-4">
          <div
            role="group"
            aria-label="Timeline view"
            className="inline-flex w-fit rounded-lg border border-border bg-card p-0.5"
          >
            <Button
              type="button"
              size="sm"
              variant={timelineView === "milestones" ? "default" : "ghost"}
              onClick={() => onTimelineViewChange("milestones")}
            >
              Milestones
            </Button>
            <Button
              type="button"
              size="sm"
              variant={timelineView === "gantt" ? "default" : "ghost"}
              onClick={() => onTimelineViewChange("gantt")}
            >
              Gantt
            </Button>
          </div>
          {timelineView === "gantt" ? (
            <ProjectGanttPanel
              key={project.id}
              projectId={project.id}
              tasks={tasks}
              milestones={milestones}
            />
          ) : (
            <ProjectTimelinePanel
              projectId={project.id}
              milestones={milestones}
              tasks={tasks}
            />
          )}
        </div>
      ) : null}

      {!isPending && activeTab === "documents" ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {documents.length === 0
                ? "No documents linked to this project yet."
                : `${documents.length} document${documents.length === 1 ? "" : "s"}`}
            </p>
            {documents.length > 0 ? (
              <NewDocumentButton contextType="invoice" variant="outline" clientId={project.client_id} projectId={project.id} />
            ) : null}
          </div>
          {documents.length > 0 ? (
            <DocumentsTable documents={documents} />
          ) : (
            <EmptyStateCard
              icon={FileText}
              title="No documents yet"
              description="Create a proposal, quote, or invoice from this project."
              action={
                <NewDocumentButton contextType="invoice" clientId={project.client_id} projectId={project.id} />
              }
            />
          )}
        </div>
      ) : null}

      {!isPending && activeTab === "time" ? (
        <div className="space-y-6">
          <ProjectProfitabilityPanel
            project={project}
            invoices={invoices}
            expenses={expenses}
            timeEntries={timeEntries}
            currency={defaultCurrency}
          />
          <ProjectTimeRollupPanel
            project={project}
            tasks={tasks}
            expenses={expenses}
            timeEntries={timeEntries}
            currency={defaultCurrency}
          />
        </div>
      ) : null}

      {!isPending && activeTab === "expenses" ? (
        <ProjectExpensesPanel
          projectId={project.id}
          expenses={expenses}
          projects={projects}
          defaultCurrency={defaultCurrency}
        />
      ) : null}
    </>
  );
}
