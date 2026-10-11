import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type {
  ProjectTemplateMilestoneRow,
  ProjectTemplateRow,
  ProjectTemplateSummaryRow,
  ProjectTemplateTaskRow,
  ProjectTemplateWithDetails,
} from "@/types";

export const TEMPLATE_CACHE_TAG = "project-templates";

type TemplateSummaryDbRow = ProjectTemplateRow & {
  project_template_milestones: { count: number }[];
  project_template_tasks: { count: number }[];
};

function normalizeTemplateSummary(row: TemplateSummaryDbRow): ProjectTemplateSummaryRow {
  return {
    id: row.id,
    user_id: row.user_id,
    is_system: row.is_system,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
    milestone_count: row.project_template_milestones?.[0]?.count ?? 0,
    task_count: row.project_template_tasks?.[0]?.count ?? 0,
  };
}

function normalizeTemplateWithDetails(
  row: ProjectTemplateRow & {
    project_template_milestones: ProjectTemplateWithDetails["milestones"];
    project_template_tasks: ProjectTemplateWithDetails["tasks"];
  },
): ProjectTemplateWithDetails {
  return {
    id: row.id,
    user_id: row.user_id,
    is_system: row.is_system,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
    milestones: (row.project_template_milestones ?? []).sort(
      (a: ProjectTemplateMilestoneRow, b: ProjectTemplateMilestoneRow) =>
        a.sort_order - b.sort_order,
    ),
    tasks: (row.project_template_tasks ?? []).sort(
      (a: ProjectTemplateTaskRow, b: ProjectTemplateTaskRow) =>
        a.sort_order - b.sort_order,
    ),
  };
}

const _cachedListProjectTemplates = unstable_cache(
  async (userId: string): Promise<ProjectTemplateRow[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("project_templates")
      .select("*")
      .or(`is_system.eq.true,user_id.eq.${userId}`)
      .order("is_system", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("[listProjectTemplates]", error.message);
      return [];
    }

    return data ?? [];
  },
  ["project-templates-list"],
  { revalidate: 60, tags: [TEMPLATE_CACHE_TAG] },
);

export async function listProjectTemplates(): Promise<ProjectTemplateRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListProjectTemplates(user.id);
}

const _cachedListProjectTemplateSummaries = unstable_cache(
  async (userId: string): Promise<ProjectTemplateSummaryRow[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("project_templates")
      .select(
        "*, project_template_milestones(count), project_template_tasks(count)",
      )
      .or(`is_system.eq.true,user_id.eq.${userId}`)
      .order("is_system", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("[listProjectTemplateSummaries]", error.message);
      return [];
    }

    return (data ?? []).map((row) =>
      normalizeTemplateSummary(row as TemplateSummaryDbRow),
    );
  },
  ["project-templates-summaries"],
  { revalidate: 60, tags: [TEMPLATE_CACHE_TAG] },
);

export async function listProjectTemplateSummaries(): Promise<
  ProjectTemplateSummaryRow[]
> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListProjectTemplateSummaries(user.id);
}

const _cachedGetProjectTemplate = unstable_cache(
  async (
    userId: string,
    templateId: string,
  ): Promise<ProjectTemplateWithDetails | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("project_templates")
      .select(
        "*, project_template_milestones(*), project_template_tasks(*)",
      )
      .eq("id", templateId)
      .or(`is_system.eq.true,user_id.eq.${userId}`)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return normalizeTemplateWithDetails(
      data as ProjectTemplateRow & {
        project_template_milestones: ProjectTemplateWithDetails["milestones"];
        project_template_tasks: ProjectTemplateWithDetails["tasks"];
      },
    );
  },
  ["project-template-detail"],
  { revalidate: 60, tags: [TEMPLATE_CACHE_TAG] },
);

export async function getProjectTemplate(
  templateId: string,
): Promise<ProjectTemplateWithDetails | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  return _cachedGetProjectTemplate(user.id, templateId);
}
