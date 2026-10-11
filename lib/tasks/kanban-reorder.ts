import type { TaskRow, TaskStatus } from "@/types";

export const KANBAN_COLUMN_STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "done",
  "cancelled",
];

export function isKanbanColumnId(id: string): id is TaskStatus {
  return (KANBAN_COLUMN_STATUSES as readonly string[]).includes(id);
}

export function sortTasksByColumnOrder<T extends TaskRow>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...items];
  const [removed] = next.splice(fromIndex, 1);
  if (removed === undefined) {
    return items;
  }
  next.splice(toIndex, 0, removed);
  return next;
}

export type TaskSortOrderUpdate = {
  projectId: string;
  taskId: string;
  sort_order: number;
};

/** Reorder tasks within a single status column; returns null when no change. */
export function reorderTasksInColumn<T extends TaskRow>(
  tasks: T[],
  activeId: string,
  overId: string,
): { nextTasks: T[]; updates: TaskSortOrderUpdate[] } | null {
  const activeTask = tasks.find((task) => task.id === activeId);
  const overTask = tasks.find((task) => task.id === overId);
  if (!activeTask || !overTask || activeTask.status !== overTask.status) {
    return null;
  }

  const columnTasks = sortTasksByColumnOrder(
    tasks.filter((task) => task.status === activeTask.status),
  );
  const oldIndex = columnTasks.findIndex((task) => task.id === activeId);
  const newIndex = columnTasks.findIndex((task) => task.id === overId);
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return null;
  }

  const reordered = moveItem(columnTasks, oldIndex, newIndex);
  const sortOrderById = new Map(
    reordered.map((task, index) => [task.id, index] as const),
  );

  const nextTasks = tasks.map((task) => {
    const nextSortOrder = sortOrderById.get(task.id);
    if (nextSortOrder === undefined) {
      return task;
    }
    return { ...task, sort_order: nextSortOrder };
  });

  const updates = reordered.map((task, index) => ({
    projectId: task.project_id,
    taskId: task.id,
    sort_order: index,
  }));

  return { nextTasks, updates };
}
