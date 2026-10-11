"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTask, reorderTasks } from "@/lib/tasks/actions";
import {
  isKanbanColumnId,
  reorderTasksInColumn,
  sortTasksByColumnOrder,
} from "@/lib/tasks/kanban-reorder";
import { taskStatusChange } from "@/lib/tasks/task-utils";
import type { TaskRow, TaskStatus } from "@/types";

import { KanbanCard } from "./kanban-card";
import { KanbanColumn, KanbanColumnStatic } from "./kanban-column";
import { TaskEditSheet } from "./task-edit-sheet";

const COLUMNS = [
  {
    status: "todo" as TaskStatus,
    label: "To do",
    dotClass: "status-dot--muted",
  },
  {
    status: "in_progress" as TaskStatus,
    label: "In progress",
    dotClass: "status-dot--info",
  },
  {
    status: "done" as TaskStatus,
    label: "Done",
    dotClass: "status-dot--success",
  },
  {
    status: "cancelled" as TaskStatus,
    label: "Cancelled",
    dotClass: "status-dot--muted",
  },
] as const;

type KanbanBoardProps = {
  tasks: TaskRow[];
  allTasks: TaskRow[];
  projectId: string;
  onAddTask: (status: TaskStatus) => void;
};

export function KanbanBoard({
  tasks: initialTasks,
  allTasks: initialAllTasks,
  projectId,
  onAddTask,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [allTasks, setAllTasks] = useState(initialAllTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [dndReady, setDndReady] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setAllTasks(initialAllTasks);
  }, [initialAllTasks]);

  useEffect(() => {
    setDndReady(true);
  }, []);

  const activeTask = activeId
    ? (tasks.find((t) => t.id === activeId) ?? null)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!isKanbanColumnId(overId)) {
      const reorderResult = reorderTasksInColumn(tasks, taskId, overId);
      if (!reorderResult) return;

      const previousTasks = tasks;
      setTasks(reorderResult.nextTasks);

      startTransition(async () => {
        const res = await reorderTasks(reorderResult.updates);
        if (!res.ok) {
          setTasks(previousTasks);
          toast.error(res.message ?? "Failed to reorder tasks.");
          return;
        }
        router.refresh();
      });
      return;
    }

    const newStatus = overId;
    if (task.status === newStatus) return;

    const previousStatus = task.status;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    startTransition(async () => {
      const res = await updateTask(projectId, taskId, taskStatusChange(newStatus));
      if (!res.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: previousStatus } : t,
          ),
        );
        toast.error(res.message ?? "Failed to update task.");
        return;
      }
      router.refresh();
    });
  }

  function handleCardClick(task: TaskRow) {
    setSelectedTask(task);
    setSheetOpen(true);
  }

  function handleSheetClose() {
    setSheetOpen(false);
    setSelectedTask(null);
  }

  function handleTaskSaved(updated: TaskRow) {
    setAllTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    );
    setTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    );
    router.refresh();
  }

  function handleTaskDeleted(taskId: string) {
    setAllTasks((prev) =>
      prev.filter((t) => t.id !== taskId && t.parent_task_id !== taskId),
    );
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    router.refresh();
  }

  function handleTaskCreated(created: TaskRow) {
    setAllTasks((prev) => [...prev, created]);
    if (created.parent_task_id === null) {
      setTasks((prev) => [...prev, created]);
    }
    router.refresh();
  }

  const columnProps = (col: (typeof COLUMNS)[number]) => ({
    status: col.status,
    label: col.label,
    dotClass: col.dotClass,
    tasks: sortTasksByColumnOrder(
      tasks.filter((t) => t.status === col.status && t.parent_task_id === null),
    ),
    allTasks,
    onCardClick: handleCardClick,
    onAddTask,
  });

  return (
    <>
      {dndReady ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-3.5 @sm/shell:grid-cols-2 @4xl/shell:grid-cols-4">
            {COLUMNS.map((col) => (
              <KanbanColumn key={col.status} {...columnProps(col)} />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="rotate-1 scale-[1.02] shadow-xl">
                <KanbanCard task={activeTask} onClick={() => {}} isDragOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div
          className="grid min-w-0 grid-cols-1 items-stretch gap-3.5 @sm/shell:grid-cols-2 @4xl/shell:grid-cols-4"
          aria-busy="true"
          aria-label="Loading board interactions"
        >
          {COLUMNS.map((col) => (
            <KanbanColumnStatic key={col.status} {...columnProps(col)} />
          ))}
        </div>
      )}

      <TaskEditSheet
        task={selectedTask}
        allTasks={allTasks}
        projectId={projectId}
        open={sheetOpen}
        onClose={handleSheetClose}
        onSaved={handleTaskSaved}
        onDeleted={handleTaskDeleted}
        onCreated={handleTaskCreated}
      />
    </>
  );
}
