"use client";

import type { ComponentType } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TaskRow, TaskStatus } from "@/types";

import { Button } from "@/components/ui/button";

import { KanbanCard, KanbanCardStatic } from "./kanban-card";

type KanbanColumnBaseProps = {
  status: TaskStatus;
  label: string;
  dotClass: string;
  tasks: TaskRow[];
  allTasks: TaskRow[];
  onCardClick: (task: TaskRow) => void;
  onAddTask: (status: TaskStatus) => void;
};

function KanbanColumnShell({
  status,
  label,
  dotClass,
  tasks,
  allTasks,
  onCardClick,
  onAddTask,
  columnRef,
  isOver,
  CardComponent,
}: KanbanColumnBaseProps & {
  columnRef?: (node: HTMLElement | null) => void;
  isOver?: boolean;
  CardComponent: ComponentType<{
    task: TaskRow;
    subtasks: Pick<TaskRow, "status">[];
    onClick: () => void;
  }>;
}) {
  return (
    <div
      ref={columnRef}
      className={cn(
        "flex min-h-[200px] min-w-0 flex-col rounded-[var(--surface-radius)] bg-[var(--bg-subtle)]/55 p-1.5 transition-colors md:min-h-[360px]",
        isOver && "bg-[var(--accent-soft)]",
      )}
    >
      <div className="flex h-8 items-center gap-1.5 ps-3 pe-1">
        <span className={cn("status-dot", dotClass)} aria-hidden />
        <span className="text-body font-medium">{label}</span>
        <span className="text-meta text-[var(--fg-3)] tabular-nums">{tasks.length}</span>
        <div className="flex-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() => onAddTask(status)}
          aria-label={`Add task to ${label}`}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 pt-1">
        {tasks.length === 0 ? (
          <p className="rounded-[10px] border border-dashed border-border px-2 py-5 text-center text-meta text-[var(--fg-3)]">
            No tasks here
          </p>
        ) : (
          tasks.map((task) => {
            const subtasks = allTasks.filter((t) => t.parent_task_id === task.id);
            return (
              <CardComponent
                key={task.id}
                task={task}
                subtasks={subtasks}
                onClick={() => onCardClick(task)}
              />
            );
          })
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 justify-start px-3 text-meta text-[var(--fg-3)] hover:bg-card"
          onClick={() => onAddTask(status)}
        >
          <Plus className="size-3" />
          Add task
        </Button>
      </div>
    </div>
  );
}

export function KanbanColumn(props: KanbanColumnBaseProps) {
  const { setNodeRef, isOver } = useDroppable({ id: props.status });

  return (
    <KanbanColumnShell
      {...props}
      columnRef={setNodeRef}
      isOver={isOver}
      CardComponent={KanbanCard}
    />
  );
}

/** SSR-safe column without dnd-kit droppable hooks. */
export function KanbanColumnStatic(props: KanbanColumnBaseProps) {
  return <KanbanColumnShell {...props} CardComponent={KanbanCardStatic} />;
}
