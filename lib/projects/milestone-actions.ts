"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import {
  parseMilestoneCreateInput,
  parseMilestoneUpdateInput,
} from "@/lib/validations/milestone";
import type { ProjectMilestoneRow, ProjectMilestoneStatus } from "@/types";

const uuidSchema = z.string().uuid();

type ProjectMilestoneRowRaw = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  sort_order: number | null;
  client_visible: boolean | null;
  created_at: string;
  updated_at: string;
};

function normalizeMilestoneRow(
  row: ProjectMilestoneRowRaw,
): ProjectMilestoneRow {
  return {
    id: row.id,
    project_id: row.project_id,
    title: row.title,
    description: row.description,
    status: row.status as ProjectMilestoneStatus,
    due_date: row.due_date,
    sort_order: row.sort_order ?? 0,
    client_visible: row.client_visible ?? false,
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

function revalidateMilestonePaths(projectId: string) {
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidateTag("projects");
  revalidateTag("tasks");
}

export type ListProjectMilestonesResult =
  | { ok: true; milestones: ProjectMilestoneRow[] }
  | { ok: false; message: string };

const _cachedListProjectMilestones = unstable_cache(
  async (
    userId: string,
    projectId: string,
  ): Promise<ListProjectMilestonesResult> => {
    const supabase = createAdminClient() as unknown as Awaited<
      ReturnType<typeof createSupabaseClient>
    >;
    const owned = await projectBelongsToUser(supabase, userId, projectId);
    if (!owned) {
      return { ok: false, message: "Project not found." };
    }

    const { data, error } = await supabase
      .from("project_milestones")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      milestones: (data ?? []).map((row) =>
        normalizeMilestoneRow(row as ProjectMilestoneRowRaw),
      ),
    };
  },
  ["project-milestones-list"],
  { revalidate: 60, tags: ["projects"] },
);

export async function listProjectMilestones(
  projectId: string,
): Promise<ListProjectMilestonesResult> {
  const parsedId = uuidSchema.safeParse(projectId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid project." };
  }

  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  return _cachedListProjectMilestones(user.id, parsedId.data);
}

export type ListAllMilestonesResult =
  | { ok: true; milestones: ProjectMilestoneRow[] }
  | { ok: false; message: string };

const _cachedListAllMilestonesForUser = unstable_cache(
  async (userId: string): Promise<ListAllMilestonesResult> => {
    const supabase = createAdminClient() as unknown as Awaited<
      ReturnType<typeof createSupabaseClient>
    >;

    const { data, error } = await supabase
      .from("project_milestones")
      .select("*, projects!inner(id, user_id)")
      .eq("projects.user_id", userId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      milestones: (data ?? []).map((row) =>
        normalizeMilestoneRow(row as ProjectMilestoneRowRaw),
      ),
    };
  },
  ["all-milestones-list"],
  { revalidate: 60, tags: ["projects", "tasks"] },
);

export async function listAllMilestonesForUser(): Promise<ListAllMilestonesResult> {
  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  return _cachedListAllMilestonesForUser(user.id);
}

export type CreateProjectMilestoneResult =
  | { ok: true; milestone: ProjectMilestoneRow }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function createProjectMilestone(
  projectId: string,
  input: unknown,
): Promise<CreateProjectMilestoneResult> {
  const parsedId = uuidSchema.safeParse(projectId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid project." };
  }

  const parsed = parseMilestoneCreateInput(input);
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

  const owned = await projectBelongsToUser(supabase, user.id, parsedId.data);
  if (!owned) {
    return { ok: false, message: "Project not found." };
  }

  const { data, error } = await supabase
    .from("project_milestones")
    .insert({ project_id: parsedId.data, ...parsed.data })
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Milestone could not be created." };
  }

  revalidateMilestonePaths(parsedId.data);
  return {
    ok: true,
    milestone: normalizeMilestoneRow(data as ProjectMilestoneRowRaw),
  };
}

export type UpdateProjectMilestoneResult =
  | { ok: true; milestone: ProjectMilestoneRow }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function updateProjectMilestone(
  projectId: string,
  milestoneId: string,
  input: unknown,
): Promise<UpdateProjectMilestoneResult> {
  const parsedProjectId = uuidSchema.safeParse(projectId);
  const parsedMilestoneId = uuidSchema.safeParse(milestoneId);
  if (!parsedProjectId.success || !parsedMilestoneId.success) {
    return { ok: false, message: "Invalid milestone." };
  }

  const parsed = parseMilestoneUpdateInput(input);
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

  const { data, error } = await supabase
    .from("project_milestones")
    .update(parsed.data)
    .eq("id", parsedMilestoneId.data)
    .eq("project_id", parsedProjectId.data)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Milestone not found." };
  }

  revalidateMilestonePaths(parsedProjectId.data);
  return {
    ok: true,
    milestone: normalizeMilestoneRow(data as ProjectMilestoneRowRaw),
  };
}

export type DeleteProjectMilestoneResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteProjectMilestone(
  projectId: string,
  milestoneId: string,
): Promise<DeleteProjectMilestoneResult> {
  const parsedProjectId = uuidSchema.safeParse(projectId);
  const parsedMilestoneId = uuidSchema.safeParse(milestoneId);
  if (!parsedProjectId.success || !parsedMilestoneId.success) {
    return { ok: false, message: "Invalid milestone." };
  }

  const { supabase, user } = await getServerContext();

  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const owned = await projectBelongsToUser(supabase, user.id, parsedProjectId.data);
  if (!owned) {
    return { ok: false, message: "Project not found." };
  }

  const { error, count } = await supabase
    .from("project_milestones")
    .delete({ count: "exact" })
    .eq("id", parsedMilestoneId.data)
    .eq("project_id", parsedProjectId.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (count === 0) {
    return { ok: false, message: "Milestone not found." };
  }

  revalidateMilestonePaths(parsedProjectId.data);
  revalidatePath("/tasks");

  return { ok: true };
}
