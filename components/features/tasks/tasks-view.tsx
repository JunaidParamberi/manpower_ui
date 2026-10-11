"use client";

import { usePathname, useRouter } from "next/navigation";
import { Suspense, useMemo, useState, useTransition } from "react";
import { KanbanSquare, List, ListTodo, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { buildWeeklyPlan } from "@/lib/projects/project-intelligence";
import {
  countDistinctProjectsWithOpenTasks,
  countOpenTasks,
  countOverdueTasks,
  filterTasks,
  getSubtasksForParent,
  sortTasks,
  taskStatusChange,
  type TaskListFilters,
  type TaskRouteViewMode,
} from "@/lib/tasks/task-utils";
import { useTaskFilters } from "@/lib/tasks/use-task-filters";
import { deleteTask, updateTask } from "@/lib/tasks/actions";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import type {
  ProjectListRow,
  ProjectMilestoneRow,
  TaskListRow,
  TaskRow as TaskRowData,
  TaskStatus,
} from "@/types";

import { TaskEditSheet } from "@/components/features/tasks/task-edit-sheet";
import { BulkActionBar } from "@/components/shared/bulk-action-bar";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { PageHeader } from "@/components/shared/page-header";
import { TaskFilters } from "@/components/features/tasks/task-filters";
import { TasksKanbanBoard } from "@/components/features/tasks/tasks-kanban-board";
import { TaskRow } from "@/components/features/tasks/task-row";
import { TasksSummaryStrip } from "@/components/features/tasks/tasks-summary-strip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

type TasksViewProps = {
  tasks: TaskListRow[];
  projects: ProjectListRow[];
  milestones: ProjectMilestoneRow[];
  initialFilters: TaskListFilters;
  initialViewMode: TaskRouteViewMode;
};

function WeeklyPlanPanel({
  tasks,
  milestones,
}: {
  tasks: TaskListRow[];
  milestones: ProjectMilestoneRow[];
}) {
  const plan = useMemo(
    () => buildWeeklyPlan({ tasks, milestones }),
    [tasks, milestones],
  );
  const groups = [
    { label: "Overdue", items: plan.overdue },
    { label: "Due today", items: plan.dueToday },
    { label: "High priority", items: plan.highPriority },
    { label: "Quick wins", items: plan.quickWins },
    { label: "Waiting on client", items: plan.waitingOnClient },
    { label: "Milestones", items: plan.upcomingMilestones },
  ];

  return (
    <section
      id="weekly-plan"
      className="mb-5 rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-xs)]"
    >
      <div className="flex flex-col gap-1">
        <p className="eyebrow">Rule-based plan</p>
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          This week’s focus
        </h2>
        <p className="text-sm text-muted-foreground">
          Deterministic planning from due dates, priorities, estimates, labels,
          and client-visible flags. No AI is used here yet.
        </p>
      </div>
      <div className="mt-4 grid gap-3 @sm/shell:grid-cols-2 @xl/shell:grid-cols-3 @5xl/shell:grid-cols-6">
        {groups.map((group) => (
          <div key={group.label} className="rounded-lg bg-muted/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{group.label}</p>
              <span className="tabs__count">{group.items.length}</span>
            </div>
            {group.items.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2">
                {group.items.slice(0, 3).map((item) => (
                  <li key={item.id} className="text-xs text-muted-foreground">
                    {item.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">Nothing here.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function TasksView({
  tasks,
  projects,
  milestones,
  initialFilters,
  initialViewMode,
}: TasksViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [addDefaultStatus, setAddDefaultStatus] =
    useState<TaskListRow["status"]>("todo");
  const [viewMode, setViewMode] = useState<TaskRouteViewMode>(initialViewMode);
  const [isBulkPending, startBulkTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskListRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const filters = useTaskFilters(initialFilters);

  const filtered = useMemo(() => {
    const narrowed = filterTasks(tasks, filters, searchQuery);
    return sortTasks(narrowed, filters.sort);
  }, [tasks, filters, searchQuery]);

  const topLevelFiltered = useMemo(
    () => filtered.filter((task) => task.parent_task_id === null),
    [filtered],
  );

  const subtasksByParent = useMemo(() => {
    const map = new Map<string, TaskListRow[]>();
    for (const parent of topLevelFiltered) {
      map.set(parent.id, getSubtasksForParent(tasks, parent.id));
    }
    return map;
  }, [tasks, topLevelFiltered]);

  const bulk = useBulkSelection(topLevelFiltered);

  const open = countOpenTasks(tasks);
  const overdue = countOverdueTasks(tasks);
  const projectCount = countDistinctProjectsWithOpenTasks(tasks);

  const subtitle = `${open} open across ${projectCount} ${projectCount === 1 ? "project" : "projects"} · ${overdue} overdue`;

  const hasAnyTasks = tasks.length > 0;
  const hasFilteredResults = topLevelFiltered.length > 0;

  function clearFilters() {
    router.push(pathname);
  }

  function bulkDelete() {
    const ids = [...bulk.selectedIds];
    startBulkTransition(async () => {
      const taskMap = new Map(topLevelFiltered.map((t) => [t.id, t]));
      const results = await Promise.all(
        ids.map((id) => {
          const t = taskMap.get(id);
          return t ? deleteTask(t.project_id, id) : Promise.resolve({ ok: false as const, message: "Not found" });
        }),
      );
      const failed = results.filter((r) => !r.ok).length;
      bulk.clearSelection();
      router.refresh();
      if (failed > 0) {
        toast.error(`${failed} task${failed > 1 ? "s" : ""} failed to delete.`);
      } else {
        toast.success(`${ids.length} task${ids.length > 1 ? "s" : ""} deleted.`);
      }
    });
  }

  function bulkSetStatus(status: TaskStatus) {
    const ids = [...bulk.selectedIds];
    startBulkTransition(async () => {
      const taskMap = new Map(topLevelFiltered.map((t) => [t.id, t]));
      const results = await Promise.all(
        ids.map((id) => {
          const t = taskMap.get(id);
          return t ? updateTask(t.project_id, id, taskStatusChange(status)) : Promise.resolve({ ok: false as const, message: "Not found" });
        }),
      );
      const failed = results.filter((r) => !r.ok).length;
      bulk.clearSelection();
      router.refresh();
      if (failed > 0) {
        toast.error(`${failed} task${failed > 1 ? "s" : ""} failed to update.`);
      } else {
        toast.success(`${ids.length} task${ids.length > 1 ? "s" : ""} updated.`);
      }
    });
  }

  function openEditTask(task: TaskListRow) {
    setSelectedTask(task);
    setSheetOpen(true);
  }

  function handleSheetClose() {
    setSheetOpen(false);
    setSelectedTask(null);
  }

  function handleTaskSaved() {
    router.refresh();
  }

  function handleTaskDeleted() {
    handleSheetClose();
    router.refresh();
  }

  function handleTaskCreated() {
    router.refresh();
  }

  function mergeTaskRow(task: TaskListRow, updated: TaskRowData): TaskListRow {
    return { ...task, ...updated, project: task.project };
  }

  function setMode(mode: TaskRouteViewMode) {
    setViewMode(mode);
    const params = new URLSearchParams(window.location.search);
    if (mode === "board") {
      params.delete("mode");
    } else {
      params.set("mode", mode);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function openAddTask(status: TaskListRow["status"] = "todo") {
    setAddDefaultStatus(status);
    setSelectedTask(null);
    setSheetOpen(true);
  }

  function scrollToWeeklyPlan() {
    document.getElementById("weekly-plan")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        className="mb-7"
        eyebrow="Tasks"
        title="Tasks"
        description={subtitle}
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 border border-border shadow-[var(--shadow-xs)]"
              onClick={scrollToWeeklyPlan}
            >
              Weekly plan
            </Button>
            <Button
              type="button"
              className="shrink-0"
              onClick={() => openAddTask("todo")}
              disabled={projects.length === 0}
            >
              <Plus data-icon="inline-start" strokeWidth={1.6} />
              New task
            </Button>
          </>
        }
      />

      <TasksSummaryStrip tasks={tasks} filters={filters} />

      {hasAnyTasks ? (
        <WeeklyPlanPanel tasks={topLevelFiltered} milestones={milestones} />
      ) : null}

      <section className="flex flex-col">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {viewMode === "board"
              ? "Board view groups tasks by status across every project."
              : "List view keeps the inbox compact for scanning and filters."}
          </p>
          <div className="inline-flex self-start rounded-lg border border-border bg-card p-0.5 sm:self-auto">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "board" ? "default" : "ghost"}
              onClick={() => setMode("board")}
            >
              <KanbanSquare data-icon="inline-start" />
              Board
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "list" ? "default" : "ghost"}
              onClick={() => setMode("list")}
            >
              <List data-icon="inline-start" />
              List
            </Button>
          </div>
        </div>

        <Suspense fallback={null}>
          <TaskFilters
            filters={filters}
            projects={projects}
            tasks={tasks}
          />
        </Suspense>

        <div className="mb-4">
          <InputGroup className="w-full sm:max-w-md">
            <InputGroupAddon>
              <Search className="text-muted-foreground" aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Search tasks, projects, clients…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tasks"
            />
          </InputGroup>
        </div>

        {!hasAnyTasks ? (
          <div className="mt-5">
            <EmptyStateCard
              icon={ListTodo}
              title="No tasks yet"
              description="Add tasks here or from a project's Tasks tab."
              action={
                projects.length > 0 ? (
                  <Button type="button" size="sm" onClick={() => openAddTask("todo")}>
                    <Plus data-icon="inline-start" />
                    New task
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Create a project first to attach tasks.
                  </p>
                )
              }
            />
          </div>
        ) : !hasFilteredResults ? (
          <div className="mt-5">
            <EmptyStateCard
              icon={ListTodo}
              title="No tasks match these filters"
              description="Try adjusting your filters or choose another summary tile."
              action={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : viewMode === "board" ? (
          <TasksKanbanBoard
            tasks={topLevelFiltered}
            allTasks={tasks}
            onAddTask={openAddTask}
          />
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-xs)]">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="tasks-table-head w-8 ps-[14px] pe-0">
                    <Checkbox
                      checked={bulk.isAllSelected}
                      indeterminate={bulk.isIndeterminate}
                      onCheckedChange={bulk.toggleAll}
                      aria-label="Select all tasks"
                    />
                  </TableHead>
                  <TableHead className="tasks-table-head w-10 pe-0" />
                  <TableHead className="tasks-table-head min-w-[12rem]">
                    Task
                  </TableHead>
                  <TableHead className="tasks-table-head hidden md:table-cell">
                    Project
                  </TableHead>
                  <TableHead className="tasks-table-head hidden sm:table-cell">
                    Status
                  </TableHead>
                  <TableHead className="tasks-table-head hidden sm:table-cell">
                    Priority
                  </TableHead>
                  <TableHead className="tasks-table-head hidden lg:table-cell">
                    Due
                  </TableHead>
                  <TableHead className="tasks-table-head w-12 pe-[18px] text-end">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLevelFiltered.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    subtasks={subtasksByParent.get(task.id) ?? []}
                    isSelected={bulk.selectedIds.has(task.id)}
                    onToggleSelect={() => bulk.toggleRow(task.id)}
                    onEdit={openEditTask}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

        )}
      </section>

      <BulkActionBar count={bulk.count} onClearSelection={bulk.clearSelection}>
        <Select onValueChange={(v) => bulkSetStatus(v as TaskStatus)} disabled={isBulkPending}>
          <SelectTrigger className="h-8 w-[140px] text-sm">
            <SelectValue placeholder="Set status…" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {TASK_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={bulkDelete}
          disabled={isBulkPending}
        >
          <Trash2 className="mr-1.5 size-3.5" />
          Delete
        </Button>
      </BulkActionBar>

      <TaskEditSheet
        task={selectedTask}
        allTasks={tasks}
        projectId={
          selectedTask?.project_id ??
          (filters.project !== "all" ? filters.project : "")
        }
        open={sheetOpen}
        onClose={handleSheetClose}
        onSaved={(updated) => {
          setSelectedTask((current) =>
            current?.id === updated.id ? mergeTaskRow(current, updated) : current,
          );
          handleTaskSaved();
        }}
        onDeleted={() => handleTaskDeleted()}
        onCreated={() => {
          handleTaskCreated();
          handleSheetClose();
        }}
        defaultStatus={addDefaultStatus}
        projects={projects}
        defaultProjectId={
          filters.project !== "all" ? filters.project : null
        }
      />
    </div>
  );
}
