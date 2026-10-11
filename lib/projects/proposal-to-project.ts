import type { ProposalContent } from "@/types";

export type ProjectPlanDraftMilestone = {
  title: string;
  description: string | null;
  sort_order: number;
  client_visible: boolean;
};

export type ProjectPlanDraftTask = {
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  sort_order: number;
  milestone_title: string | null;
};

export type ProjectPlanDraft = {
  title: string;
  milestones: ProjectPlanDraftMilestone[];
  tasks: ProjectPlanDraftTask[];
};

function cleanTitle(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function buildProjectPlanDraftFromProposal(
  proposal: ProposalContent,
): ProjectPlanDraft {
  const timelineMilestones =
    proposal.timeline?.map((phase, index): ProjectPlanDraftMilestone => ({
      title: cleanTitle(phase.name, `Phase ${index + 1}`),
      description:
        phase.span_weeks > 1
          ? `Weeks ${phase.start_week}-${phase.start_week + phase.span_weeks - 1}`
          : `Week ${phase.start_week}`,
      sort_order: index,
      client_visible: true,
    })) ?? [];

  const fallbackMilestones =
    timelineMilestones.length > 0
      ? timelineMilestones
      : (proposal.milestones ?? []).map((title, index) => ({
          title: cleanTitle(title, `Milestone ${index + 1}`),
          description: null,
          sort_order: index,
          client_visible: true,
        }));

  const milestones = fallbackMilestones;
  const tasks =
    proposal.deliverables?.map((deliverable, index): ProjectPlanDraftTask => {
      const milestone = milestones[index % Math.max(1, milestones.length)];
      return {
        title: cleanTitle(deliverable.name, `Deliverable ${deliverable.num}`),
        description: deliverable.description?.trim() || null,
        estimated_minutes:
          deliverable.hours != null ? Math.round(deliverable.hours * 60) : null,
        sort_order: index,
        milestone_title: milestone?.title ?? null,
      };
    }) ?? [];

  return {
    title: cleanTitle(proposal.headline, "New project"),
    milestones,
    tasks,
  };
}
