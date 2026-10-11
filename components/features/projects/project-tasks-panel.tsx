"use client";

import { createPortal } from "react-dom";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTask } from "@/lib/tasks/actions";
import { formatProjectDate } from "@/lib/projects/display";
import type { ProjectsHubViewMode } from "@/lib/projects/hub-view-preference";
import { getSubtasksForParent, isTaskOverdue, taskStatusChange } from "@/lib/tasks/task-utils";
import type { TaskPriority, TaskRow, TaskStatus } from "@/types";

import { KanbanBoard } from "@/components/features/tasks/kanban-board";
import { TaskViewSwitch } from "@/components/features/projects/task-view-switch";
import { TaskEditSheet } from "@/components/features/tasks/task-edit-sheet";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ClipboardList, ChevronDown, ChevronRight, Filter, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type ProjectTaskFilters = {
  status: TaskStatus | "all";
  priority: TaskPriority | "all";
  sortBy: "due" | "created";
};

type ProjectTasksPanelProps = {
  projectId: string;
  initialTasks: TaskRow[];
  viewMode: ProjectsHubViewMode;
  onViewModeChange: (mode: ProjectsHubViewMode) => void;
  filters: ProjectTaskFilters;
  onFiltersChange: (filters: ProjectTaskFilters) => void;
  /** Render the toolbar into this element (e.g. the end of a tabs row) instead of above the tasks. */
  toolbarTarget?: HTMLElement | null;
};

export function ProjectTasksPanel({
  projectId,
  initialTasks,
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
  toolbarTarget,
}: ProjectTasksPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createDefaultStatus, setCreateDefaultStatus] = useState<TaskStatus>("todo");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    let list = [...initialTasks];
    if (filters.status !== "all") {
      list = list.filter((t) => t.status === filters.status);
    }
    if (filters.priority !== "all") {
      list = list.filter((t) => t.priority === filters.priority);
    }
    list.sort((a, b) => {
      if (filters.sortBy === "created") {
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }
      const ad = a.due_date
        ? new Date(`${a.due_date}T12:00:00Z`).getTime()
        : Number.POSITIVE_INFINITY;
      const bd = b.due_date
        ? new Date(`${b.due_date}T12:00:00Z`).getTime()
        : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
    return list;
  }, [initialTasks, filters]);

  const topLevelTasks = useMemo(
    () => filteredTasks.filter((task) => task.parent_task_id === null),
    [filteredTasks],
  );

  function refresh() {
    router.refresh();
  }

  function openAddTask(status: TaskStatus = "todo") {
    setCreateDefaultStatus(status);
    setSelectedTask(null);
    setSheetOpen(true);
  }

  function toggleDone(task: TaskRow) {
    startTransition(async () => {
      const next: TaskStatus = task.status === "done" ? "todo" : "done";
      const res = await updateTask(projectId, task.id, taskStatusChange(next));
      if (!res.ok) {
        toast.error(res.message ?? "Failed to update task.");
        return;
      }
      refresh();
    });
  }

  function resetFilters() {
    onFiltersChange({ status: "all", priority: "all", sortBy: "due" });
  }

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.sortBy !== "due";
  function openEditTask(task: TaskRow) {
    setSelectedTask(task);
    setSheetOpen(true);
  }

  function handleSheetClose() {
    setSheetOpen(false);
    setSelectedTask(null);
  }

  function handleTaskSaved(_updated: TaskRow) {
    refresh();
  }

  function handleTaskDeleted(taskId: string) {
    void taskId;
    handleSheetClose();
    refresh();
  }

  function handleTaskCreated() {
    refresh();
  }

  const emptyTitle =
    initialTasks.length === 0 ? "No tasks yet" : "No tasks match filters";
  const emptyDescription =
    initialTasks.length === 0
      ? "Add tasks to track deliverables and completion for this project."
      : "Adjust the task filters to bring hidden work back into view.";

  const toolbar = (
    <ProjectTasksToolbar
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      filters={filters}
      onFiltersChange={onFiltersChange}
      filterOpen={filterOpen}
      onFilterOpenChange={setFilterOpen}
      onAddTask={() => openAddTask("todo")}
    />
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {toolbarTarget ? createPortal(toolbar, toolbarTarget) : toolbar}

      {topLevelTasks.length === 0 ? (
        <EmptyStateCard
          icon={ClipboardList}
          title={emptyTitle}
          description={emptyDescription}
          action={
            initialTasks.length === 0 ? (
              <Button type="button" size="sm" onClick={() => openAddTask("todo")}>
                <Plus data-icon="inline-start" />
                Add task
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
              >
                <Filter />
                Clear filters
              </Button>
            )
          }
        />
      ) : viewMode === "board" ? (
        <KanbanBoard
          tasks={topLevelTasks}
          allTasks={initialTasks}
          projectId={projectId}
          onAddTask={openAddTask}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2 md:hidden">
            {topLevelTasks.map((task) => (
              <ProjectTaskMobileCard
                key={task.id}
                task={task}
                subtasks={getSubtasksForParent(initialTasks, task.id)}
                isPending={isPending}
                onToggleDone={toggleDone}
                onEdit={openEditTask}
              />
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-xs md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="tasks-table-head w-8" />
                  <TableHead className="tasks-table-head">Task</TableHead>
                  <TableHead className="tasks-table-head">Status</TableHead>
                  <TableHead className="tasks-table-head">Priority</TableHead>
                  <TableHead className="tasks-table-head">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLevelTasks.map((task) => (
                  <ProjectTaskTableRow
                    key={task.id}
                    task={task}
                    subtasks={getSubtasksForParent(initialTasks, task.id)}
                    isPending={isPending}
                    onToggleDone={toggleDone}
                    onEdit={openEditTask}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <TaskEditSheet
        task={selectedTask}
        allTasks={initialTasks}
        projectId={projectId}
        open={sheetOpen}
        onClose={handleSheetClose}
        onSaved={handleTaskSaved}
        onDeleted={handleTaskDeleted}
        onCreated={handleTaskCreated}
        defaultStatus={createDefaultStatus}
      />
    </div>
  );
}

type ProjectTasksToolbarProps = {
  viewMode: ProjectsHubViewMode;
  onViewModeChange: (mode: ProjectsHubViewMode) => void;
  filters: ProjectTaskFilters;
  onFiltersChange: (filters: ProjectTaskFilters) => void;
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  onAddTask: () => void;
};

function ProjectTasksToolbar({
  viewMode,
  onViewModeChange,
  filters,
  onFiltersChange,
  filterOpen,
  onFilterOpenChange,
  onAddTask,
}: ProjectTasksToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <TaskViewSwitch value={viewMode} onChange={onViewModeChange} />
        <Popover open={filterOpen} onOpenChange={onFilterOpenChange}>
          <PopoverTrigger
            render={
              <Button type="button" variant="outline" size="sm">
                <Filter data-icon="inline-start" />
                Filter
              </Button>
            }
          />
          <PopoverContent align="end" className="w-56 p-3.5">
            <div className="flex flex-col gap-3">
              <TaskFilterSelect
                label="Status"
                value={filters.status}
                onValueChange={(v) => {
                  if (
                    v === "all" ||
                    v === "todo" ||
                    v === "in_progress" ||
                    v === "done" ||
                    v === "cancelled"
                  ) {
                    onFiltersChange({ ...filters, status: v });
                  }
                }}
                items={[
                  ["all", "All statuses"],
                  ["todo", "To do"],
                  ["in_progress", "In progress"],
                  ["done", "Done"],
                  ["cancelled", "Cancelled"],
                ]}
              />
              <TaskFilterSelect
                label="Priority"
                value={filters.priority}
                onValueChange={(v) => {
                  if (
                    v === "all" ||
                    v === "low" ||
                    v === "medium" ||
                    v === "high"
                  ) {
                    onFiltersChange({ ...filters, priority: v });
                  }
                }}
                items={[
                  ["all", "All priorities"],
                  ["high", "High"],
                  ["medium", "Medium"],
                  ["low", "Low"],
                ]}
              />
              {viewMode === "list" ? (
                <TaskFilterSelect
                  label="Sort"
                  value={filters.sortBy}
                  onValueChange={(v) => {
                    if (v === "due" || v === "created") {
                      onFiltersChange({ ...filters, sortBy: v });
                    }
                  }}
                  items={[
                    ["due", "Due date"],
                    ["created", "Created"],
                  ]}
                />
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
        <Button type="button" size="sm" onClick={onAddTask}>
          <Plus data-icon="inline-start" />
          Add task
        </Button>
    </div>
  );
}

type TaskFilterSelectProps = {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: [string, string][];
};

function TaskFilterSelect({
  label,
  value,
  onValueChange,
  items,
}: TaskFilterSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) onValueChange(nextValue);
        }}
      >
        <SelectTrigger size="sm" className="w-full">
          <SelectValue>
            {items.find(([itemValue]) => itemValue === value)?.[1] ?? value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map(([itemValue, itemLabel]) => (
              <SelectItem key={itemValue} value={itemValue}>
                {itemLabel}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

type ProjectTaskMobileCardProps = {
  task: TaskRow;
  subtasks?: TaskRow[];
  isPending: boolean;
  onToggleDone: (task: TaskRow) => void;
  onEdit: (task: TaskRow) => void;
};

function ProjectTaskMobileCard({
  task,
  subtasks = [],
  isPending,
  onToggleDone,
  onEdit,
}: ProjectTaskMobileCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isDone = task.status === "done";
  const overdue = isTaskOverdue(task);
  const hasSubtasks = subtasks.length > 0;

  return (
    <article className="rounded-xl border border-border bg-card shadow-xs">
      <div
        className="cursor-pointer p-3"
        onClick={() => onEdit(task)}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            className="mt-0.5"
            checked={isDone}
            disabled={isPending}
            onCheckedChange={() => onToggleDone(task)}
            onClick={(e) => e.stopPropagation()}
            aria-label={isDone ? "Mark task as not done" : "Mark task as done"}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5">
              {hasSubtasks ? (
                <button
                  type="button"
                  className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpanded((value) => !value);
                  }}
                  aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
                  aria-expanded={expanded}
                >
                  {expanded ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                </button>
              ) : null}
              <p
                className={cn(
                  "text-sm font-medium leading-snug text-foreground",
                  isDone && "text-muted-foreground line-through",
                )}
              >
                {task.title}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={task.status} dot />
              <TaskPriorityBadge priority={task.priority} />
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 text-right text-xs tabular-nums text-muted-foreground",
              overdue && !isDone && "font-medium text-destructive",
            )}
          >
            {task.due_date ? formatProjectDate(task.due_date) : "No due date"}
          </span>
        </div>
      </div>
      {expanded
        ? subtasks.map((subtask) => (
            <button
              key={subtask.id}
              type="button"
              className="flex w-full items-center justify-between border-t border-border px-3 py-2 text-left hover:bg-muted/30"
              onClick={() => onEdit(subtask)}
            >
              <span
                className={cn(
                  "ps-6 text-sm text-muted-foreground",
                  subtask.status === "done" && "line-through",
                )}
              >
                {subtask.title}
              </span>
              <StatusBadge status={subtask.status} dot />
            </button>
          ))
        : null}
    </article>
  );
}

type ProjectTaskTableRowProps = {
  task: TaskRow;
  subtasks: TaskRow[];
  isPending: boolean;
  onToggleDone: (task: TaskRow) => void;
  onEdit: (task: TaskRow) => void;
};

function ProjectTaskTableRow({
  task,
  subtasks,
  isPending,
  onToggleDone,
  onEdit,
}: ProjectTaskTableRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isDone = task.status === "done";
  const overdue = isTaskOverdue(task);
  const hasSubtasks = subtasks.length > 0;

  return (
    <>
      <TableRow
        className="tasks-table-row cursor-pointer"
        onClick={() => onEdit(task)}
      >
        <TableCell className="tasks-table-cell w-8">
          <Checkbox
            checked={isDone}
            disabled={isPending}
            onCheckedChange={() => onToggleDone(task)}
            onClick={(e) => e.stopPropagation()}
            aria-label={
              isDone ? "Mark task as not done" : "Mark task as done"
            }
          />
        </TableCell>
        <TableCell className="tasks-table-cell">
          <div className="flex items-center gap-1.5">
            {hasSubtasks ? (
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  setExpanded((value) => !value);
                }}
                aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
                aria-expanded={expanded}
              >
                {expanded ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
              </button>
            ) : null}
            <p
              className={cn(
                "text-sm font-medium",
                isDone && "text-muted-foreground line-through",
              )}
            >
              {task.title}
            </p>
            {hasSubtasks ? (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                {subtasks.length}
              </span>
            ) : null}
          </div>
        </TableCell>
        <TableCell className="tasks-table-cell">
          <StatusBadge status={task.status} dot />
        </TableCell>
        <TableCell className="tasks-table-cell">
          <TaskPriorityBadge priority={task.priority} />
        </TableCell>
        <TableCell
          className={cn(
            "tasks-table-cell tabular-nums text-sm",
            overdue && !isDone && "text-destructive",
          )}
        >
          {task.due_date ? formatProjectDate(task.due_date) : "—"}
        </TableCell>
      </TableRow>
      {expanded
        ? subtasks.map((subtask) => {
            const subDone = subtask.status === "done";
            const subOverdue = isTaskOverdue(subtask);
            return (
              <TableRow
                key={subtask.id}
                className="tasks-table-row cursor-pointer bg-muted/20"
                onClick={() => onEdit(subtask)}
              >
                <TableCell className="tasks-table-cell w-8" />
                <TableCell className="tasks-table-cell">
                  <p
                    className={cn(
                      "ps-6 text-sm text-muted-foreground",
                      subDone && "line-through",
                    )}
                  >
                    {subtask.title}
                  </p>
                </TableCell>
                <TableCell className="tasks-table-cell">
                  <StatusBadge status={subtask.status} dot />
                </TableCell>
                <TableCell className="tasks-table-cell">
                  <TaskPriorityBadge priority={subtask.priority} />
                </TableCell>
                <TableCell
                  className={cn(
                    "tasks-table-cell tabular-nums text-sm",
                    subOverdue && !subDone && "text-destructive",
                  )}
                >
                  {subtask.due_date ? formatProjectDate(subtask.due_date) : "—"}
                </TableCell>
              </TableRow>
            );
          })
        : null}
    </>
  );
}

function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <StatusBadge
      status={
        priority === "high" ? "high" : priority === "medium" ? "med" : "low"
      }
    />
  );
}
