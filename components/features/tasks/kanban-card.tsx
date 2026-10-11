"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { CalendarDays, Clock, Eye } from "lucide-react";

import { formatTaskDueDisplay } from "@/lib/tasks/display";
import { computeSubtaskProgress } from "@/lib/projects/project-progress";
import { cn } from "@/lib/utils";
import type { TaskRow } from "@/types";

type KanbanCardContentProps = {
  task: TaskRow;
  subtasks?: Pick<TaskRow, "status">[];
};

const PRIORITY_MARK: Record<TaskRow["priority"], { label: string; className: string }> = {
  high: { label: "High", className: "bg-[var(--danger)]" },
  medium: { label: "Medium", className: "bg-[var(--warning)]" },
  low: { label: "Low", className: "bg-[var(--fg-3)]" },
};

/**
 * Everything worth seeing on a task without opening it: labels, title, a
 * two-line description preview, priority, due (red when late), estimate,
 * portal visibility and subtask progress.
 */
export function KanbanCardContent({ task, subtasks = [] }: KanbanCardContentProps) {
  const isDimmed = task.status === "done" || task.status === "cancelled";
  const labels = task.labels ?? [];
  const dueDisplay = task.due_date ? formatTaskDueDisplay(task) : null;
  const estimateLabel =
    task.estimated_minutes !== null
      ? task.estimated_minutes >= 60
        ? `${Math.floor(task.estimated_minutes / 60)}h${task.estimated_minutes % 60 ? ` ${task.estimated_minutes % 60}m` : ""}`
        : `${task.estimated_minutes}m`
      : null;
  const subtaskProgress = subtasks.length > 0 ? computeSubtaskProgress(subtasks) : null;
  const priority = PRIORITY_MARK[task.priority];
  const description = task.description?.trim();

  return (
    <div className="flex flex-col gap-2">
      {labels.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {labels.map((l) => (
            <span
              key={l}
              className="rounded-full border border-border px-1.5 py-px text-label font-medium text-[var(--fg-2)]"
            >
              {l}
            </span>
          ))}
        </div>
      ) : null}

      <p className={cn("text-body leading-snug font-medium", isDimmed && "text-[var(--fg-3)] line-through")}>
        {task.title}
      </p>

      {description && !isDimmed ? (
        <p className="line-clamp-2 text-meta leading-relaxed text-[var(--fg-3)]">{description}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-meta text-[var(--fg-3)]">
        <span className="inline-flex items-center gap-1.5" title={`${priority.label} priority`}>
          <span aria-hidden className={cn("size-1.5 rounded-full", priority.className)} />
          {priority.label}
        </span>
        {dueDisplay ? (
          <span className={cn("inline-flex items-center gap-1 tabular-nums", dueDisplay.className)}>
            <CalendarDays className="size-3" aria-hidden />
            {dueDisplay.label}
          </span>
        ) : null}
        {estimateLabel ? (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="size-3" aria-hidden />
            {estimateLabel}
          </span>
        ) : null}
        {task.client_visible ? (
          <span className="inline-flex items-center gap-1" title="Visible in the client portal">
            <Eye className="size-3" aria-hidden />
            Portal
          </span>
        ) : null}
      </div>

      {subtaskProgress && subtaskProgress.total > 0 ? (
        <div className="flex items-center gap-2 border-t border-border pt-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--success)] transition-all"
              // Width is data.
              style={{ width: `${subtaskProgress.percent}%` }}
            />
          </div>
          <span className="shrink-0 text-label tabular-nums text-[var(--fg-3)]">
            {subtaskProgress.done}/{subtaskProgress.total} subtasks
          </span>
        </div>
      ) : null}
    </div>
  );
}

type KanbanCardProps = {
  task: TaskRow;
  subtasks?: Pick<TaskRow, "status">[];
  onClick: () => void;
  isDragOverlay?: boolean;
};

export function KanbanCard({
  task,
  subtasks,
  onClick,
  isDragOverlay = false,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } =
    useDraggable({ id: task.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  function setNodeRef(node: HTMLElement | null) {
    setDragRef(node);
    setDropRef(node);
  }

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={cn(
        "cursor-grab select-none touch-none rounded-[10px] border border-border bg-card px-3 pt-2.5 pb-3 shadow-[var(--shadow-xs)]",
        "transition-[box-shadow,border-color] duration-150 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]",
        (task.status === "done" || task.status === "cancelled") && "opacity-70",
        isOver && !isDragging && !isDragOverlay && "ring-2 ring-primary/25",
        isDragging && !isDragOverlay && "opacity-50 shadow-none",
      )}
    >
      <KanbanCardContent task={task} subtasks={subtasks} />
    </div>
  );
}

type KanbanCardStaticProps = {
  task: TaskRow;
  subtasks?: Pick<TaskRow, "status">[];
  onClick: () => void;
};

/** SSR-safe card without dnd-kit attributes (avoids hydration mismatch). */
export function KanbanCardStatic({ task, subtasks, onClick }: KanbanCardStaticProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[10px] border border-border bg-card px-3 pt-2.5 pb-3 text-left shadow-[var(--shadow-xs)]",
        "transition-[box-shadow,border-color] duration-150 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]",
        (task.status === "done" || task.status === "cancelled") && "opacity-70",
      )}
    >
      <KanbanCardContent task={task} subtasks={subtasks} />
    </button>
  );
}
