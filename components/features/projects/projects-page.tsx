"use client";

import { NewDocumentButton } from "@/components/features/documents/workspace/new-document-button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Clock, LayoutTemplate, Plus } from "lucide-react";
import { PaneSearchBox } from "@/components/shared/pane-search-box";
import { toast } from "sonner";

import { ProjectPeek } from "@/components/features/projects/project-peek";
import { ProjectWorkspace, type HubTab } from "@/components/features/projects/project-workspace";
import { ProjectsBoardView } from "@/components/features/projects/projects-board-view";
import { ProjectFocusHeader } from "@/components/features/projects/project-focus-header";
import { ProjectLensChips } from "@/components/features/projects/project-lens-chips";
import { ProjectsListPane } from "@/components/features/projects/projects-list-view";
import { ProjectsViewSwitch } from "@/components/features/projects/projects-view-switch";
import { ProjectsTimelineView } from "@/components/features/projects/projects-timeline-view";
import { Button } from "@/components/ui/button";
import { projectHelpFromData } from "@/lib/kraft/record-help";
import { updateProject } from "@/lib/projects/actions";
import type { DigestInvoiceInput } from "@/lib/projects/digest-facts";
import {
  PROJECT_TIMELINE_VIEW_STORAGE_KEY,
  PROJECTS_HUB_VIEW_STORAGE_KEY,
  projectTimelineViewCookieValue,
  projectsHubViewCookieValue,
  type ProjectsHubViewMode,
  type TimelineSubView,
} from "@/lib/projects/hub-view-preference";
import {
  PROJECTS_LIST_LAYOUT_STORAGE_KEY,
  projectsListLayoutCookieValue,
  type ProjectsListLayout,
} from "@/lib/projects/list-layout-preference";
import {
  PORTFOLIO_LENSES,
  applyPatches,
  filterPortfolio,
  lensCounts,
  withPace,
  type PortfolioLens,
  type PortfolioPatch,
} from "@/lib/projects/portfolio-filters";
import type { PortfolioProject } from "@/lib/projects/portfolio-summary";
import type { TimelineZoom } from "@/lib/projects/portfolio-timeline";
import type { ProfitabilityInvoice } from "@/lib/projects/project-profitability";
import { updateTask } from "@/lib/tasks/actions";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type {
  DocumentListRow,
  ExpenseListRow,
  ProjectListRow,
  ProjectMilestoneRow,
  ProjectStatus,
  TaskRow,
  TimeEntryListRow,
} from "@/types";

export type WorkspaceData = {
  project: ProjectListRow;
  tasks: TaskRow[];
  milestones: ProjectMilestoneRow[];
  timeEntries: TimeEntryListRow[];
  expenses: ExpenseListRow[];
  documents: DocumentListRow[];
  invoices: ProfitabilityInvoice[];
  digestInvoices: DigestInvoiceInput[];
};

export type ProjectsPageProps = {
  projects: PortfolioProject[];
  today: string;
  view: ProjectsListLayout;
  lens: PortfolioLens;
  query: string;
  zoom: TimelineZoom;
  selectedId: string | null;
  invalidSelection: boolean;
  workspace: WorkspaceData | null;
  currency: string;
  userDisplayName: string;
  initialTaskViewMode: ProjectsHubViewMode;
  initialTimelineView: TimelineSubView;
  activeTab: HubTab;
};

/**
 * The projects page: lenses, search and a List / Board / Timeline switch over
 * one portfolio, with the selected project's workspace inline (List) or in a
 * side panel (Board, Timeline). URL holds view, lens, q, zoom, project, tab.
 */
export function ProjectsPage({
  projects,
  today,
  view,
  lens,
  query,
  zoom,
  selectedId,
  invalidSelection,
  workspace,
  currency,
  userDisplayName,
  initialTaskViewMode,
  initialTimelineView,
  activeTab,
}: ProjectsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();
  const [patches, setPatches] = useState<PortfolioPatch[]>([]);
  const [search, setSearch] = useState(query);
  const [taskViewMode, setTaskViewMode] = useState<ProjectsHubViewMode>(initialTaskViewMode);
  const [timelineView, setTimelineView] = useState<TimelineSubView>(initialTimelineView);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Row clicked in List while its workspace loads: highlight it right away.
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Back/forward or "Show all" changes `q` in the URL; mirror it in the box.
  useEffect(() => setSearch(query), [query]);
  useEffect(() => setPendingId(null), [selectedId]);

  // Fresh server data reflects (or rejects) the optimistic edits.
  useEffect(() => setPatches([]), [projects]);

  const paced = useMemo(() => applyPatches(withPace(projects, today), patches, today), [projects, patches, today]);
  const visible = useMemo(() => filterPortfolio(paced, lens, search), [paced, lens, search]);
  const counts = useMemo(() => lensCounts(paced), [paced]);
  const selected = paced.find((p) => p.id === selectedId) ?? null;
  const showWorkspace = Boolean(selected && workspace && workspace.project.id === selected.id);

  const active = paced.filter((p) => p.status === "active");
  const budgetLeft = active.reduce((sum, p) => sum + Math.max(0, (p.budget ?? 0) - p.spend), 0);

  function setParams(next: Record<string, string | null>, mode: "push" | "replace" = "replace") {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    const url = `/projects${qs ? `?${qs}` : ""}`;
    startTransition(() => {
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    });
  }

  function changeView(next: ProjectsListLayout) {
    try {
      localStorage.setItem(PROJECTS_LIST_LAYOUT_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the cookie still carries the choice.
    }
    document.cookie = projectsListLayoutCookieValue(next);
    setParams({ view: next, project: next === "list" ? selectedId : null });
  }

  function onSearch(value: string) {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setParams({ q: value.trim() || null }), 250);
  }

  function openProject(id: string) {
    if (view === "list" && window.matchMedia("(max-width: 1023px)").matches) {
      router.push(`/projects/${id}`);
      return;
    }
    setPendingId(id);
    setParams({ project: id, tab: activeTab }, "push");
  }

  async function moveProject(id: string, status: ProjectStatus) {
    const title = paced.find((p) => p.id === id)?.title ?? "Project";
    const patch: PortfolioPatch = { id, status };
    setPatches((prev) => [...prev, patch]);
    const result = await updateProject(id, { status });
    if (!result.ok) {
      setPatches((prev) => prev.filter((x) => x !== patch));
      toast.error(`Couldn't move ${title}. Try again.`);
    }
  }

  /**
   * Save new dates optimistically. `undoable` adds an Undo that puts back the
   * exact dates from before (a missing start date stays missing).
   */
  async function reschedule(id: string, dates: { start_date: string; deadline: string }, undoable = true) {
    const p = paced.find((x) => x.id === id);
    if (!p) return;
    const before = { start_date: p.start_date ?? "", deadline: p.deadline ?? "" };
    // Rollback removes exactly this patch, never an earlier one with the same value.
    const patch: PortfolioPatch = { id, start_date: dates.start_date || undefined, deadline: dates.deadline || undefined };
    setPatches((prev) => [...prev, patch]);
    const result = await updateProject(id, dates);
    if (!result.ok) {
      setPatches((prev) => prev.filter((x) => x !== patch));
      toast.error(`Couldn't move ${p.title}. Try again.`);
      return;
    }
    if (!undoable) {
      toast.success(`Moved ${p.title} back`);
      return;
    }
    toast.success(`Moved ${p.title}`, {
      action: { label: "Undo", onClick: () => void reschedule(id, before, false) },
    });
  }

  async function completeTask(projectId: string, taskId: string) {
    const result = await updateTask(projectId, taskId, { status: "done" });
    if (!result.ok) toast.error("Couldn't complete that task. Try again.");
  }

  function handleTaskViewChange(mode: ProjectsHubViewMode) {
    setTaskViewMode(mode);
    try {
      localStorage.setItem(PROJECTS_HUB_VIEW_STORAGE_KEY, mode);
    } catch {
      // Cookie below still persists it.
    }
    document.cookie = projectsHubViewCookieValue(mode);
  }

  function handleTimelineViewChange(next: TimelineSubView) {
    setTimelineView(next);
    try {
      localStorage.setItem(PROJECT_TIMELINE_VIEW_STORAGE_KEY, next);
    } catch {
      // Cookie below still persists it.
    }
    document.cookie = projectTimelineViewCookieValue(next);
  }

  const lensLabel = PORTFOLIO_LENSES.find((l) => l.id === lens)?.label ?? "All";
  function clearFilters() {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearch("");
    setParams({ lens: null, q: null });
  }

  const trimmed = search.trim();
  const emptyMessage = (
    <span className="flex flex-col items-start gap-2">
      <span className="text-[var(--fg-2)]">
        {trimmed
          ? `No projects match “${trimmed}”${lens === "all" ? "" : ` in ${lensLabel}`}.`
          : {
              all: "No projects yet.",
              needs_you: "Nothing needs you right now. Nice.",
              active: "No active projects right now.",
              planning: "Nothing in planning.",
              done: "No finished projects yet.",
            }[lens]}
      </span>
      <Button size="sm" variant="outline" onClick={clearFilters}>
        {trimmed ? "Clear search" : "Show all projects"}
      </Button>
    </span>
  );

  const workspaceNode =
    showWorkspace && selected && workspace ? (
      <ProjectWorkspace
        variant="focus"
        pace={selected.pace}
        focusHeader={false}
        focusActions={
          view === "list" ? (
            <>
              <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/time" />}>
                <Clock data-icon="inline-start" />
                Log time
              </Button>
              <NewDocumentButton contextType="invoice" variant="outline" label="Invoice" clientId={workspace.project.client_id} projectId={workspace.project.id} />
            </>
          ) : null
        }
        project={workspace.project}
        projects={projects}
        tasks={workspace.tasks}
        milestones={workspace.milestones}
        timeEntries={workspace.timeEntries}
        expenses={workspace.expenses}
        documents={workspace.documents}
        invoices={workspace.invoices}
        digestInvoices={workspace.digestInvoices}
        defaultCurrency={currency}
        userDisplayName={userDisplayName}
        activeTab={activeTab}
        onTabChange={(tab) => setParams({ project: selected.id, tab }, "push")}
        viewMode={taskViewMode}
        onViewModeChange={handleTaskViewChange}
        timelineView={timelineView}
        onTimelineViewChange={handleTimelineViewChange}
        isPending={isNavigating && pendingId !== null && pendingId !== selectedId}
      />
    ) : null;

  const switchingProject = isNavigating && pendingId !== null && pendingId !== selectedId;
  // While switching, the header already shows the project being opened: the
  // list row has everything the header needs, so only the body waits.
  const headerProject = (switchingProject ? paced.find((p) => p.id === pendingId) : null) ?? selected;
  const kraftHelp = useMemo(
    () =>
      workspace
        ? projectHelpFromData({
            project: workspace.project,
            tasks: workspace.tasks,
            expenses: workspace.expenses,
            invoices: workspace.digestInvoices,
            nowIso: new Date().toISOString(),
            currency,
          })
        : null,
    [workspace, currency],
  );

  // Workspace header picks up a hairline + shadow once its body scrolls.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setScrolled(false), [selectedId]);

  // Sections of the main block: no cards, just a dividing line between them.
  const BLOCK = "flex min-h-0 min-w-0 flex-col lg:overflow-hidden";

  const summary = (
    <p className="mt-0.5 text-meta text-[var(--fg-3)]">
      {active.length} active
      {budgetLeft > 0 ? `, ${formatCurrency(budgetLeft, currency)} left` : ""}
      {counts.needs_you > 0 ? <span className="font-medium text-[var(--danger)]"> · {counts.needs_you} need you</span> : null}
    </p>
  );

  const createButtons = (
    <div className="flex shrink-0 items-center gap-1.5">
      <Button size="icon-sm" variant="outline" nativeButton={false} render={<Link href="/projects/templates" />} aria-label="Templates" title="Templates">
        <LayoutTemplate />
      </Button>
      <Button size="icon-sm" nativeButton={false} render={<Link href="/projects/new" />} aria-label="New project" title="New project">
        <Plus />
      </Button>
    </div>
  );

  const searchBox = (
    <PaneSearchBox value={search} onChange={onSearch} placeholder="Find a project" ariaLabel="Find a project" />
  );

  const lensChips = (
    <ProjectLensChips lens={lens} counts={counts} onChange={(l) => setParams({ lens: l === "all" ? null : l })} />
  );
  const viewSwitch = <ProjectsViewSwitch view={view} onChange={changeView} />;

  const invalidNote = invalidSelection ? (
    <p className="rounded-md bg-[var(--bg-subtle)] px-3 py-2 text-meta text-[var(--fg-2)]">
      That project link is no longer available. Showing your projects instead.
    </p>
  ) : null;

  return (
    <div
      data-page-fullbleed
      className="flex min-h-0 flex-col lg:h-[calc(100dvh-var(--topbar-h)-var(--shell-inset))] lg:flex-row"
    >
      {view === "list" ? (
        <>
          {/* List block: the portfolio */}
          <section aria-label="Projects" className={cn(BLOCK, "w-full lg:w-[360px] lg:shrink-0 lg:border-r lg:border-border")}>
            <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 pt-4 pb-3.5 sm:px-6 lg:px-7 lg:pt-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h1 className="font-heading text-[17px] font-semibold tracking-[-0.01em]">Projects</h1>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {viewSwitch}
                    {createButtons}
                  </div>
                </div>
                {summary}
              </div>
              {searchBox}
              {/* Chips get the full row and scroll sideways when they don't fit. */}
              <div className="-mx-4 min-w-0 px-4 sm:-mx-6 sm:px-6 lg:-mx-3.5 lg:px-3.5">{lensChips}</div>
              {invalidNote}
            </div>
            <ProjectsListPane
              projects={visible}
              selectedId={pendingId ?? selectedId}
              onSelect={openProject}
              emptyMessage={emptyMessage}
            />
          </section>

          {/* Workspace block: the selected project */}
          <section aria-label="Project" className={cn(BLOCK, "hidden flex-1 lg:flex")}>
            {selected && workspace && showWorkspace ? (
              <>
                {headerProject ? (
                  <div
                    className={cn(
                      "relative z-[2] shrink-0 border-b px-7 pt-6 pb-4 transition-[box-shadow,border-color] duration-200",
                      scrolled ? "border-border shadow-[0_6px_12px_-10px_rgba(0,0,0,0.35)]" : "border-transparent",
                    )}
                  >
                    <ProjectFocusHeader
                      project={switchingProject ? headerProject : workspace.project}
                      pace={headerProject.pace}
                      kraftHelp={switchingProject ? null : kraftHelp}
                      actions={
                        <>
                          <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/time" />}>
                            <Clock data-icon="inline-start" />
                            Log time
                          </Button>
                          <NewDocumentButton contextType="invoice" variant="outline" label="Invoice" clientId={headerProject.client_id} projectId={headerProject.id} />
                        </>
                      }
                    />
                  </div>
                ) : null}
                <div
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                  onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 2)}
                >
                  <div className="flex w-full flex-col gap-4 px-7 pt-1 pb-10">{workspaceNode}</div>
                </div>
              </>
            ) : (
              <p className="m-auto text-body text-[var(--fg-3)]">
                {visible.length > 0 ? "Pick a project to see its work." : ""}
              </p>
            )}
          </section>
        </>
      ) : (
        /* Wide block: board or timeline */
        <section aria-label={view === "board" ? "Projects board" : "Projects timeline"} className={cn(BLOCK, "flex-1")}>
          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 pt-4 pb-3.5 sm:px-6 lg:px-7 lg:pt-6">
            <div className="me-1 min-w-0">
              <h1 className="font-heading text-[17px] font-semibold tracking-[-0.01em]">Projects</h1>
            </div>
            <div className="min-w-0 flex-1">{lensChips}</div>
            <div className="hidden w-60 sm:block">{searchBox}</div>
            {viewSwitch}
            {createButtons}
            {invalidNote ? <div className="basis-full">{invalidNote}</div> : null}
          </div>
          <div className="relative flex min-h-0 flex-1">
            {view === "board" ? (
              visible.length === 0 ? (
                <div className="m-auto p-6 text-body">{emptyMessage}</div>
              ) : (
                <ProjectsBoardView
                  projects={visible}
                  currency={currency}
                  onOpen={openProject}
                  onMove={(id, status) => void moveProject(id, status)}
                  onCompleteTask={(projectId, taskId) => void completeTask(projectId, taskId)}
                />
              )
            ) : (
              <ProjectsTimelineView
                projects={visible}
                today={today}
                zoom={zoom}
                onZoom={(z) => setParams({ zoom: z === 6 ? null : String(z) })}
                onOpen={openProject}
                onReschedule={(id, dates) => void reschedule(id, dates)}
              />
            )}
            <ProjectPeek
              open={Boolean(selected)}
              title={selected?.title ?? ""}
              href={selected ? `/projects/${selected.id}` : "/projects"}
              onClose={() => setParams({ project: null, tab: null })}
            >
              <div className="flex flex-col gap-4">
                {selected && workspace ? (
                  <ProjectFocusHeader project={workspace.project} pace={selected.pace} kraftHelp={kraftHelp} />
                ) : null}
                {workspaceNode}
              </div>
            </ProjectPeek>
          </div>
        </section>
      )}
    </div>
  );
}
