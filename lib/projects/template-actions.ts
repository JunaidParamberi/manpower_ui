"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { getServerContext } from "@/lib/supabase/get-server-context";
import {
  saveAsTemplateSchema,
  renameTemplateSchema,
} from "@/lib/validations/project-template";
import { templateToPlanDraft } from "@/lib/projects/template-utils";
import type {
  ProjectTemplateMilestoneRow,
  ProjectTemplateTaskRow,
  ProjectTemplateWithDetails,
} from "@/types";
import { TEMPLATE_CACHE_TAG } from "@/lib/projects/template-queries";

const uuidSchema = z.string().uuid();

type TemplateDetailDbRow = {
  id: string;
  user_id: string | null;
  is_system: boolean;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  project_template_milestones: ProjectTemplateWithDetails["milestones"];
  project_template_tasks: ProjectTemplateWithDetails["tasks"];
};

function buildTemplateWithDetails(
  template: TemplateDetailDbRow,
): ProjectTemplateWithDetails {
  return {
    id: template.id,
    user_id: template.user_id,
    is_system: template.is_system,
    name: template.name,
    description: template.description,
    created_at: template.created_at,
    updated_at: template.updated_at,
    milestones: (template.project_template_milestones ?? []).sort(
      (a: ProjectTemplateMilestoneRow, b: ProjectTemplateMilestoneRow) =>
        a.sort_order - b.sort_order,
    ),
    tasks: (template.project_template_tasks ?? []).sort(
      (a: ProjectTemplateTaskRow, b: ProjectTemplateTaskRow) =>
        a.sort_order - b.sort_order,
    ),
  };
}

// ---------------------------------------------------------------------------
// Save project as template (copies milestones + tasks from a project).
// ---------------------------------------------------------------------------
export type SaveAsTemplateResult =
  | { ok: true; templateId: string }
  | { ok: false; message: string };

export async function createTemplateFromProject(
  raw: unknown,
): Promise<SaveAsTemplateResult> {
  const parsed = saveAsTemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, projectId, description } = parsed.data;
  const trimmedDescription = description?.trim() || null;

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, message: "Not authenticated." };

  const { data: project, error: projectErr } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (projectErr || !project) {
    return { ok: false, message: "Project not found." };
  }

  const { data: template, error: tErr } = await supabase
    .from("project_templates")
    .insert({
      user_id: user.id,
      name,
      description: trimmedDescription,
      is_system: false,
    })
    .select("id")
    .single();

  if (tErr || !template) {
    return { ok: false, message: tErr?.message ?? "Failed to create template." };
  }

  const templateId = template.id;

  const { data: milestones } = await supabase
    .from("project_milestones")
    .select("id, title, description, sort_order, client_visible")
    .eq("project_id", projectId)
    .order("sort_order");

  const milestoneIdMap = new Map<string, string>();

  if (milestones?.length) {
    const { data: insertedMs, error: msErr } = await supabase
      .from("project_template_milestones")
      .insert(
        milestones.map((m) => ({
          template_id: templateId,
          title: m.title,
          description: m.description,
          sort_order: m.sort_order,
          client_visible: m.client_visible,
        })),
      )
      .select("id, sort_order")
      .order("sort_order");

    if (msErr) {
      return { ok: false, message: msErr.message };
    }

    milestones.forEach((orig, index) => {
      const matched = insertedMs?.[index];
      if (matched) {
        milestoneIdMap.set(orig.id, matched.id);
      }
    });
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      "title, description, estimated_minutes, sort_order, client_visible, milestone_id",
    )
    .eq("project_id", projectId)
    .is("parent_task_id", null)
    .order("sort_order");

  if (tasks?.length) {
    const { error: tasksErr } = await supabase
      .from("project_template_tasks")
      .insert(
        tasks.map((t) => ({
          template_id: templateId,
          milestone_template_id: t.milestone_id
            ? (milestoneIdMap.get(t.milestone_id) ?? null)
            : null,
          title: t.title,
          description: t.description,
          estimated_minutes: t.estimated_minutes,
          sort_order: t.sort_order,
          client_visible: t.client_visible,
        })),
      );

    if (tasksErr) {
      return { ok: false, message: tasksErr.message };
    }
  }

  revalidateTag(TEMPLATE_CACHE_TAG);
  return { ok: true, templateId };
}

// ---------------------------------------------------------------------------
// Rename a template.
// ---------------------------------------------------------------------------
export type RenameTemplateResult =
  | { ok: true }
  | { ok: false; message: string };

export async function renameProjectTemplate(
  raw: unknown,
): Promise<RenameTemplateResult> {
  const parsed = renameTemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { templateId, name } = parsed.data;

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, message: "Not authenticated." };

  const { data: existing } = await supabase
    .from("project_templates")
    .select("is_system")
    .eq("id", templateId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { ok: false, message: "Template not found." };
  }
  if (existing.is_system) {
    return { ok: false, message: "System templates cannot be renamed." };
  }

  const { error } = await supabase
    .from("project_templates")
    .update({ name })
    .eq("id", templateId)
    .eq("user_id", user.id)
    .eq("is_system", false);

  if (error) return { ok: false, message: error.message };

  revalidateTag(TEMPLATE_CACHE_TAG);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Apply a template to an existing project (called after creation).
// ---------------------------------------------------------------------------
export type ApplyTemplateResult =
  | { ok: true }
  | { ok: false; message: string };

export async function applyTemplateToProject(
  projectId: unknown,
  templateId: unknown,
): Promise<ApplyTemplateResult> {
  const parsedProject = uuidSchema.safeParse(projectId);
  if (!parsedProject.success) return { ok: false, message: "Invalid project ID." };

  const parsedTemplate = uuidSchema.safeParse(templateId);
  if (!parsedTemplate.success) return { ok: false, message: "Invalid template ID." };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, message: "Not authenticated." };

  const { data, error } = await supabase
    .from("project_templates")
    .select(
      "*, project_template_milestones(*), project_template_tasks(*)",
    )
    .eq("id", parsedTemplate.data)
    .or(`is_system.eq.true,user_id.eq.${user.id}`)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, message: "Template not found." };
  }

  const fullTemplate = buildTemplateWithDetails(data as TemplateDetailDbRow);
  const planDraft = templateToPlanDraft(fullTemplate);

  const { seedProjectFromPlanDraft } = await import("@/lib/projects/actions");
  return seedProjectFromPlanDraft(parsedProject.data, planDraft);
}

// ---------------------------------------------------------------------------
// Delete a template.
// ---------------------------------------------------------------------------
export type DeleteTemplateResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteProjectTemplate(
  templateId: unknown,
): Promise<DeleteTemplateResult> {
  const parsed = uuidSchema.safeParse(templateId);
  if (!parsed.success) return { ok: false, message: "Invalid template ID." };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, message: "Not authenticated." };

  const { data: existing } = await supabase
    .from("project_templates")
    .select("is_system")
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { ok: false, message: "Template not found." };
  }
  if (existing.is_system) {
    return { ok: false, message: "System templates cannot be deleted." };
  }

  const { error } = await supabase
    .from("project_templates")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .eq("is_system", false);

  if (error) return { ok: false, message: error.message };

  revalidateTag(TEMPLATE_CACHE_TAG);
  return { ok: true };
}
