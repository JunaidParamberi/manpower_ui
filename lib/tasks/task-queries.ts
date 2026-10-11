import { unstable_cache } from "next/cache";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { pickEmbed } from "@/lib/supabase/pick-embed";
import type { TaskListRow, TaskPriority, TaskRow, TaskStatus } from "@/types";

const TASK_LIST_SELECT =
  "*, project:projects!inner(id, title, clients(id, name))" as const;

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

type TaskListRowRaw = TaskRowRaw & {
  project?:
    | {
        id: string;
        title: string;
        clients?: unknown;
      }
    | {
        id: string;
        title: string;
        clients?: unknown;
      }[]
    | null;
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

function normalizeTaskListRow(row: TaskListRowRaw): TaskListRow | null {
  const base = normalizeTaskRow(row);
  const projectRaw = row.project;
  const projectNode = Array.isArray(projectRaw) ? projectRaw[0] : projectRaw;
  if (!projectNode?.id || !projectNode.title) {
    return null;
  }
  const clientEmbed = pickEmbed(projectNode.clients, "name");
  return {
    ...base,
    project: {
      id: projectNode.id,
      title: projectNode.title,
      client: clientEmbed
        ? { id: clientEmbed.id, name: clientEmbed.name }
        : null,
    },
  };
}

export type ListAllTasksResult =
  | { ok: true; tasks: TaskListRow[] }
  | { ok: false; message: string };

const _cachedListAllTasksForUser = unstable_cache(
  async (userId: string): Promise<ListAllTasksResult> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("tasks")
      .select(TASK_LIST_SELECT)
      .eq("projects.user_id", userId)
      .order("sort_order", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) {
      return { ok: false, message: error.message };
    }

    const tasks: TaskListRow[] = [];
    for (const row of data ?? []) {
      const normalized = normalizeTaskListRow(row as TaskListRowRaw);
      if (normalized) {
        tasks.push(normalized);
      }
    }

    return { ok: true, tasks };
  },
  ["tasks-list"],
  { revalidate: 60, tags: ["tasks"] }
);

export async function listAllTasksForUser(): Promise<ListAllTasksResult> {
  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }
  return _cachedListAllTasksForUser(user.id);
}

export type ListTasksForProjectResult =
  | { ok: true; tasks: TaskRow[] }
  | { ok: false; message: string };

const _cachedListTasksForProject = unstable_cache(
  async (
    userId: string,
    projectId: string,
  ): Promise<ListTasksForProjectResult> => {
    const supabase = createAdminClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();

    if (projectError) {
      return { ok: false, message: projectError.message };
    }

    if (!project) {
      return { ok: false, message: "Project not found." };
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      tasks: (data ?? []).map((row) => normalizeTaskRow(row as TaskRowRaw)),
    };
  },
  ["project-tasks-list"],
  { revalidate: 60, tags: ["tasks"] },
);

export async function listTasksForProject(
  projectId: string,
): Promise<ListTasksForProjectResult> {
  const parsedId = z.string().uuid().safeParse(projectId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid project." };
  }

  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  return _cachedListTasksForProject(user.id, parsedId.data);
}
