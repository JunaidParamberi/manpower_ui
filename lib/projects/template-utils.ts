import type { ProjectPlanDraft } from "@/lib/projects/proposal-to-project";
import type { ProjectTemplateWithDetails } from "@/types";

/**
 * Pure helper — converts a fully-loaded template into a ProjectPlanDraft
 * so that seedProjectFromPlanDraft (lib/projects/actions.ts) can consume it.
 *
 * Kept outside template-actions.ts ("use server") because Next.js requires
 * every export from a server-actions file to be an async function.
 */
export function templateToPlanDraft(
  template: ProjectTemplateWithDetails,
): ProjectPlanDraft {
  const milestones = template.milestones.map((m, index) => ({
    title: m.title,
    description: m.description,
    sort_order: index,
    client_visible: m.client_visible,
  }));

  const milestoneIdByTemplateId = new Map<string, string>(
    template.milestones.map((m) => [m.id, m.title]),
  );

  const tasks = template.tasks.map((t, index) => ({
    title: t.title,
    description: t.description,
    estimated_minutes: t.estimated_minutes,
    sort_order: index,
    milestone_title: t.milestone_template_id
      ? (milestoneIdByTemplateId.get(t.milestone_template_id) ?? null)
      : null,
  }));

  return { title: template.name, milestones, tasks };
}
