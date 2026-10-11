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
import type { TaskListRow, TaskRow, TaskStatus } from "@/types";

import { KanbanCard } from "./kanban-card";
import { KanbanColumn, KanbanColumnStatic } from "./kanban-column";
import { TaskEditSheet } from "./task-edit-sheet";

const COLUMNS = [
  { status: "todo" as TaskStatus, label: "To do", dotClass: "status-dot--muted" },
  {
    status: "in_progress" as TaskStatus,
    label: "In progress",
    dotClass: "status-dot--info",
  },
  { status: "done" as TaskStatus, label: "Done", dotClass: "status-dot--success" },
  {
    status: "cancelled" as TaskStatus,
    label: "Cancelled",
    dotClass: "status-dot--muted",
  },
] as const;

type TasksKanbanBoardProps = {
  tasks: TaskListRow[];
  allTasks: TaskListRow[];
  onAddTask: (status: TaskStatus) => void;
};

function mergeTaskRow(task: TaskListRow, updated: TaskRow): TaskListRow {
  return {
    ...task,
    ...updated,
    project: task.project,
  };
}

export function TasksKanbanBoard({
  tasks: initialTasks,
  allTasks: initialAllTasks,
  onAddTask,
}: TasksKanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [allTasks, setAllTasks] = useState(initialAllTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskListRow | null>(null);
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
    ? (tasks.find((task) => task.id === activeId) ?? null)
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
    const task = tasks.find((item) => item.id === taskId);
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
      prev.map((item) =>
        item.id === taskId ? { ...item, status: newStatus } : item,
      ),
    );

    startTransition(async () => {
      const result = await updateTask(task.project_id, taskId, taskStatusChange(newStatus));
      if (!result.ok) {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === taskId ? { ...item, status: previousStatus } : item,
          ),
        );
        toast.error(result.message ?? "Failed to update task.");
        return;
      }
      router.refresh();
    });
  }

  function handleCardClick(task: TaskRow) {
    const fullTask = allTasks.find((item) => item.id === task.id);
    if (!fullTask) return;
    setSelectedTask(fullTask);
    setSheetOpen(true);
  }

  function handleSheetClose() {
    setSheetOpen(false);
    setSelectedTask(null);
  }

  function handleTaskSaved(updated: TaskRow) {
    setAllTasks((prev) =>
      prev.map((task) => (task.id === updated.id ? mergeTaskRow(task, updated) : task)),
    );
    setTasks((prev) =>
      prev.map((task) => (task.id === updated.id ? mergeTaskRow(task, updated) : task)),
    );
    setSelectedTask((current) =>
      current?.id === updated.id ? mergeTaskRow(current, updated) : current,
    );
    router.refresh();
  }

  function handleTaskDeleted(taskId: string) {
    setAllTasks((prev) =>
      prev.filter((task) => task.id !== taskId && task.parent_task_id !== taskId),
    );
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    router.refresh();
  }

  function handleTaskCreated(created: TaskRow) {
    if (!selectedTask) return;
    const enriched: TaskListRow = {
      ...created,
      project: selectedTask.project,
    };
    setAllTasks((prev) => [...prev, enriched]);
    if (enriched.parent_task_id === null) {
      setTasks((prev) => [...prev, enriched]);
    }
    router.refresh();
  }

  const columnProps = (column: (typeof COLUMNS)[number]) => ({
    status: column.status,
    label: column.label,
    dotClass: column.dotClass,
    tasks: sortTasksByColumnOrder(
      tasks.filter(
        (task) => task.status === column.status && task.parent_task_id === null,
      ),
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
          <div className="grid min-w-0 grid-cols-1 gap-3.5 @sm/shell:grid-cols-2 @4xl/shell:grid-cols-4">
            {COLUMNS.map((column) => (
              <KanbanColumn key={column.status} {...columnProps(column)} />
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
          className="grid min-w-0 grid-cols-1 gap-3.5 @sm/shell:grid-cols-2 @4xl/shell:grid-cols-4"
          aria-busy="true"
          aria-label="Loading board interactions"
        >
          {COLUMNS.map((column) => (
            <KanbanColumnStatic key={column.status} {...columnProps(column)} />
          ))}
        </div>
      )}

      <TaskEditSheet
        task={selectedTask}
        allTasks={allTasks}
        projectId={selectedTask?.project_id ?? ""}
        open={sheetOpen}
        onClose={handleSheetClose}
        onSaved={handleTaskSaved}
        onDeleted={handleTaskDeleted}
        onCreated={handleTaskCreated}
      />
    </>
  );
}
