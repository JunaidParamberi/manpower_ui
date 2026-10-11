"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { removePinnedItemForDeletedTarget } from "@/lib/pinned/cleanup";
import {
  listTasksForProject as listTasksForProjectQuery,
  type ListTasksForProjectResult,
} from "@/lib/tasks/task-queries";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import {
  parseTaskCommentCreateInput,
  parseTaskCreateInput,
  parseTaskUpdateInput,
} from "@/lib/validations/task";
import type { TaskCommentRow, TaskPriority, TaskRow, TaskStatus } from "@/types";

const uuidSchema = z.string().uuid();

type TaskRowRaw = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  due_date: string | null;
  priority: string;
  labels?: string[] | null;
  description?: string | null;
  start_date?: string | null;
  completed_at?: string | null;
  estimated_minutes?: number | string | null;
  sort_order?: number | null;
  client_visible?: boolean | null;
  parent_task_id?: string | null;
  milestone_id?: string | null;
  created_at: string;
  updated_at: string;
};

type TaskCommentRowRaw = {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  client_visible: boolean;
  created_at: string;
  updated_at: string;
};

function normalizeTaskRow(row: TaskRowRaw): TaskRow {
  return {
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    status: row.status as TaskStatus,
    due_date: row.due_date,
    priority: row.priority as TaskPriority,
    labels: Array.isArray(row.labels) ? row.labels : [],
    description: row.description ?? null,
    start_date: row.start_date ?? null,
    completed_at: row.completed_at ?? null,
    estimated_minutes:
      row.estimated_minutes === null || row.estimated_minutes === undefined
        ? null
        : Number(row.estimated_minutes),
    sort_order: row.sort_order ?? 0,
    client_visible: row.client_visible ?? false,
    parent_task_id: row.parent_task_id ?? null,
    milestone_id: row.milestone_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeTaskCommentRow(row: TaskCommentRowRaw): TaskCommentRow {
  return {
    id: row.id,
    task_id: row.task_id,
    user_id: row.user_id,
    body: row.body,
    client_visible: row.client_visible,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function projectBelongsToUser(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && !!data;
}

function revalidateTaskPaths(projectId: string) {
  revalidatePath("/tasks");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/edit`);
  revalidatePath("/projects/new");
  revalidateTag("tasks");
  revalidateTag("projects");
  revalidateTag("dashboard");
}

async function taskBelongsToProject(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  projectId: string,
  taskId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", taskId)
    .eq("project_id", projectId)
    .maybeSingle();

  return !error && !!data;
}

export type CreateTaskResult =
  | { ok: true; task: TaskRow }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function createTask(
  projectId: string,
  input: unknown,
): Promise<CreateTaskResult> {
  const parsedProjectId = uuidSchema.safeParse(projectId);
  if (!parsedProjectId.success) {
    return { ok: false, message: "Invalid project." };
  }

  const parsed = parseTaskCreateInput(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: flat.fieldErrors as Record<string, string[] | undefined>,
    };
  }

  const { supabase, user } = await getServerContext();

  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const owned = await projectBelongsToUser(
    supabase,
    user.id,
    parsedProjectId.data,
  );
  if (!owned) {
    return { ok: false, message: "Project not found." };
  }

  const payload = {
    project_id: parsedProjectId.data,
    title: parsed.data.title,
    status: parsed.data.status,
    priority: parsed.data.priority,
    due_date: parsed.data.due_date,
    labels: parsed.data.labels,
    description: parsed.data.description,
    start_date: parsed.data.start_date,
    completed_at: parsed.data.completed_at,
    estimated_minutes: parsed.data.estimated_minutes,
    sort_order: parsed.data.sort_order,
    client_visible: parsed.data.client_visible,
    parent_task_id: parsed.data.parent_task_id,
    milestone_id: parsed.data.milestone_id,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Task could not be created." };
  }

  revalidateTaskPaths(parsedProjectId.data);

  return { ok: true, task: normalizeTaskRow(data as TaskRowRaw) };
}

export type UpdateTaskResult =
  | { ok: true; task: TaskRow }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function updateTask(
  projectId: string,
  taskId: string,
  input: unknown,
): Promise<UpdateTaskResult> {
  const parsedProjectId = uuidSchema.safeParse(projectId);
  const parsedTaskId = uuidSchema.safeParse(taskId);
  if (!parsedProjectId.success || !parsedTaskId.success) {
    return { ok: false, message: "Invalid project or task." };
  }

  const parsed = parseTaskUpdateInput(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: flat.fieldErrors as Record<string, string[] | undefined>,
    };
  }

  const { supabase, user } = await getServerContext();

  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const owned = await projectBelongsToUser(
    supabase,
    user.id,
    parsedProjectId.data,
  );
  if (!owned) {
    return { ok: false, message: "Project not found." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", parsedTaskId.data)
    .eq("project_id", parsedProjectId.data)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, message: "Task not found." };
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(parsed.data)
    .eq("id", parsedTaskId.data)
    .eq("project_id", parsedProjectId.data)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Task not found or could not be updated." };
  }

  revalidateTaskPaths(parsedProjectId.data);

  return { ok: true, task: normalizeTaskRow(data as TaskRowRaw) };
}

export type ReorderTasksResult =
  | { ok: true }
  | { ok: false; message: string };

const reorderTaskUpdateSchema = z.object({
  projectId: uuidSchema,
  taskId: uuidSchema,
  sort_order: z.number().int().nonnegative(),
});

export async function reorderTasks(
  updates: { projectId: string; taskId: string; sort_order: number }[],
): Promise<ReorderTasksResult> {
  if (updates.length === 0) {
    return { ok: true };
  }

  const parsed = z.array(reorderTaskUpdateSchema).safeParse(updates);
  if (!parsed.success) {
    return { ok: false, message: "Invalid reorder payload." };
  }

  const { supabase, user } = await getServerContext();

  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const projectIds = [...new Set(parsed.data.map((item) => item.projectId))];
  for (const projectId of projectIds) {
    const owned = await projectBelongsToUser(supabase, user.id, projectId);
    if (!owned) {
      return { ok: false, message: "Project not found." };
    }
  }

  const results = await Promise.all(
    parsed.data.map(async (item) => {
      const taskOwned = await taskBelongsToProject(
        supabase,
        item.projectId,
        item.taskId,
      );
      if (!taskOwned) {
        return { ok: false as const, message: "Task not found." };
      }

      const { error } = await supabase
        .from("tasks")
        .update({ sort_order: item.sort_order })
        .eq("id", item.taskId)
        .eq("project_id", item.projectId);

      if (error) {
        return { ok: false as const, message: error.message };
      }

      return { ok: true as const };
    }),
  );

  const failed = results.find((result) => !result.ok);
  if (failed && !failed.ok) {
    return { ok: false, message: failed.message };
  }

  for (const projectId of projectIds) {
    revalidateTaskPaths(projectId);
  }

  return { ok: true };
}

export type DeleteTaskResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteTask(
  projectId: string,
  taskId: string,
): Promise<DeleteTaskResult> {
  const parsedProjectId = uuidSchema.safeParse(projectId);
  const parsedTaskId = uuidSchema.safeParse(taskId);
  if (!parsedProjectId.success || !parsedTaskId.success) {
    return { ok: false, message: "Invalid project or task." };
  }

  const { supabase, user } = await getServerContext();

  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const owned = await projectBelongsToUser(
    supabase,
    user.id,
    parsedProjectId.data,
  );
  if (!owned) {
    return { ok: false, message: "Project not found." };
  }

  const { error, count } = await supabase
    .from("tasks")
    .delete({ count: "exact" })
    .eq("id", parsedTaskId.data)
    .eq("project_id", parsedProjectId.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (count === 0) {
    return { ok: false, message: "Task not found." };
  }

  await removePinnedItemForDeletedTarget({
    supabase,
    userId: user.id,
    itemType: "task",
    itemId: parsedTaskId.data,
  });

  revalidateTaskPaths(parsedProjectId.data);

  return { ok: true };
}

export type ListTaskCommentsResult =
  | { ok: true; comments: TaskCommentRow[] }
  | { ok: false; message: string };

export async function listTaskComments(
  projectId: string,
  taskId: string,
): Promise<ListTaskCommentsResult> {
  const parsedProjectId = uuidSchema.safeParse(projectId);
  const parsedTaskId = uuidSchema.safeParse(taskId);
  if (!parsedProjectId.success || !parsedTaskId.success) {
    return { ok: false, message: "Invalid project or task." };
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const owned = await projectBelongsToUser(supabase, user.id, parsedProjectId.data);
  if (!owned) {
    return { ok: false, message: "Project not found." };
  }

  const taskOwned = await taskBelongsToProject(
    supabase,
    parsedProjectId.data,
    parsedTaskId.data,
  );
  if (!taskOwned) {
    return { ok: false, message: "Task not found." };
  }

  const { data, error } = await supabase
    .from("task_comments")
    .select("*")
    .eq("task_id", parsedTaskId.data)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    comments: (data ?? []).map((row) =>
      normalizeTaskCommentRow(row as TaskCommentRowRaw),
    ),
  };
}

export type CreateTaskCommentResult =
  | { ok: true; comment: TaskCommentRow }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function createTaskComment(
  projectId: string,
  taskId: string,
  input: unknown,
): Promise<CreateTaskCommentResult> {
  const parsedProjectId = uuidSchema.safeParse(projectId);
  const parsedTaskId = uuidSchema.safeParse(taskId);
  if (!parsedProjectId.success || !parsedTaskId.success) {
    return { ok: false, message: "Invalid project or task." };
  }

  const parsed = parseTaskCommentCreateInput(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: flat.fieldErrors as Record<string, string[] | undefined>,
    };
  }

  const { supabase, user } = await getServerContext();

  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const owned = await projectBelongsToUser(supabase, user.id, parsedProjectId.data);
  if (!owned) {
    return { ok: false, message: "Project not found." };
  }

  const taskOwned = await taskBelongsToProject(
    supabase,
    parsedProjectId.data,
    parsedTaskId.data,
  );
  if (!taskOwned) {
    return { ok: false, message: "Task not found." };
  }

  const { data, error } = await supabase
    .from("task_comments")
    .insert({
      task_id: parsedTaskId.data,
      user_id: user.id,
      body: parsed.data.body,
      client_visible: parsed.data.client_visible,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Comment could not be created." };
  }

  revalidateTaskPaths(parsedProjectId.data);

  return {
    ok: true,
    comment: normalizeTaskCommentRow(data as TaskCommentRowRaw),
  };
}

export async function listTasksForProject(
  projectId: string,
): Promise<ListTasksForProjectResult> {
  return listTasksForProjectQuery(projectId);
}
