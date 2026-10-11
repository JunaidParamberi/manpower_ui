import { describe, expect, it } from "vitest";

import { buildProjectPlanDraftFromProposal } from "@/lib/projects/proposal-to-project";
import type { ProposalContent } from "@/types";

describe("buildProjectPlanDraftFromProposal", () => {
  it("turns proposal timeline and deliverables into reviewable project plan items", () => {
    const proposal: ProposalContent = {
      headline: "Website redesign",
      deliverables: [
        { num: "1", name: "Homepage design", hours: 8 },
        { num: "2", name: "CMS setup", hours: 6 },
      ],
      timeline: [
        { name: "Design", start_week: 1, span_weeks: 2 },
        { name: "Build", start_week: 3, span_weeks: 2 },
      ],
      timeline_weeks: 4,
    };

    const draft = buildProjectPlanDraftFromProposal(proposal);

    expect(draft.title).toBe("Website redesign");
    expect(draft.milestones).toHaveLength(2);
    expect(draft.milestones[0]).toMatchObject({
      title: "Design",
      sort_order: 0,
    });
    expect(draft.tasks).toEqual([
      {
        title: "Homepage design",
        description: null,
        estimated_minutes: 480,
        sort_order: 0,
        milestone_title: "Design",
      },
      {
        title: "CMS setup",
        description: null,
        estimated_minutes: 360,
        sort_order: 1,
        milestone_title: "Build",
      },
    ]);
  });

  it("falls back to proposal milestone titles when timeline phases are missing", () => {
    const draft = buildProjectPlanDraftFromProposal({
      milestones: ["Kickoff", "Launch"],
      deliverables: [{ num: "1", name: "Launch checklist" }],
    });

    expect(draft.milestones.map((milestone) => milestone.title)).toEqual([
      "Kickoff",
      "Launch",
    ]);
    expect(draft.tasks[0]?.milestone_title).toBe("Kickoff");
  });
});
