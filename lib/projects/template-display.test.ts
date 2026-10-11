import { describe, expect, it } from "vitest";

import {
  projectTemplateCountsLabel,
  splitProjectTemplates,
} from "./template-display";
import type { ProjectTemplateSummaryRow } from "@/types";

function makeSummary(
  overrides: Partial<ProjectTemplateSummaryRow> & { id: string; name: string },
): ProjectTemplateSummaryRow {
  return {
    user_id: overrides.is_system ? null : "user-1",
    is_system: false,
    description: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    milestone_count: 2,
    task_count: 5,
    ...overrides,
  };
}

describe("splitProjectTemplates", () => {
  it("splits system and user templates", () => {
    const templates = [
      makeSummary({ id: "s1", name: "System", is_system: true, user_id: null }),
      makeSummary({ id: "u1", name: "Mine", is_system: false }),
    ];
    const { systemTemplates, userTemplates } = splitProjectTemplates(templates);
    expect(systemTemplates).toHaveLength(1);
    expect(userTemplates).toHaveLength(1);
    expect(systemTemplates[0]?.id).toBe("s1");
    expect(userTemplates[0]?.id).toBe("u1");
  });
});

describe("projectTemplateCountsLabel", () => {
  it("formats singular counts", () => {
    expect(projectTemplateCountsLabel(1, 1)).toBe("1 milestone · 1 task");
  });

  it("formats plural counts", () => {
    expect(projectTemplateCountsLabel(4, 12)).toBe("4 milestones · 12 tasks");
  });
});
