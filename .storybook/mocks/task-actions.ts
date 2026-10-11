import type { TaskCommentRow, TaskRow } from "@/types";

const mockTask: TaskRow = {
  id: "t1a2b3c4-d5e6-7890-abcd-ef1234567890",
  project_id: "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
  title: "Design homepage mockup",
  status: "in_progress",
  due_date: "2026-06-12",
  priority: "high",
  labels: ["Design", "Client"],
  description: "First-pass homepage direction for client review.",
  start_date: "2026-06-01",
  completed_at: null,
  estimated_minutes: 180,
  sort_order: 0,
  client_visible: true,
  parent_task_id: null,
  milestone_id: null,
  created_at: "2026-05-10T09:00:00Z",
  updated_at: "2026-05-22T16:00:00Z",
};

const mockComments: TaskCommentRow[] = [
  {
    id: "c1",
    task_id: mockTask.id,
    user_id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
    body: "Shared draft with client for feedback.",
    client_visible: true,
    created_at: "2026-05-20T14:30:00Z",
    updated_at: "2026-05-20T14:30:00Z",
  },
  {
    id: "c2",
    task_id: mockTask.id,
    user_id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
    body: "Need to tighten hero copy before sign-off.",
    client_visible: false,
    created_at: "2026-05-21T09:15:00Z",
    updated_at: "2026-05-21T09:15:00Z",
  },
];

export async function listTaskComments() {
  return { ok: true as const, comments: mockComments };
}

export async function createTaskComment(
  _projectId: string,
  _taskId: string,
  input: { body: string; client_visible: boolean },
) {
  return {
    ok: true as const,
    comment: {
      id: `c-${Date.now()}`,
      task_id: mockTask.id,
      user_id: "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
      body: input.body,
      client_visible: input.client_visible,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

export async function updateTask(
  _projectId: string,
  taskId: string,
  input: Partial<TaskRow>,
) {
  return {
    ok: true as const,
    task: { ...mockTask, id: taskId, ...input },
  };
}

export async function createTask(
  _projectId: string,
  input: Partial<TaskRow> & { title: string },
) {
  return {
    ok: true as const,
    task: {
      ...mockTask,
      id: `sub-${Date.now()}`,
      ...input,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

export async function deleteTask() {
  return { ok: true as const };
}

export async function reorderTasks() {
  return { ok: true as const };
}
