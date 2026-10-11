import { describe, expect, it } from "vitest";

import type { ProjectCreateFormInput } from "@/lib/validations/project";
import { buildProjectFormInsights } from "./project-form-insights";

const clients = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Atlas Creative" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Northstar Studio" },
];

function projectValues(
  overrides: Partial<ProjectCreateFormInput> = {},
): ProjectCreateFormInput {
  return {
    client_id: "",
    title: "",
    status: "planning",
    budget: "",
    spent: "",
    start_date: "",
    deadline: "",
    ...overrides,
  };
}

describe("buildProjectFormInsights", () => {
  it("summarizes selected client, budget, and timeline", () => {
    const insights = buildProjectFormInsights({
      values: projectValues({
        client_id: clients[0].id,
        title: "Website relaunch",
        status: "active",
        budget: "10000",
        spent: "2500",
        start_date: "2026-06-01",
        deadline: "2026-07-15",
      }),
      clients,
    });

    expect(insights.title).toBe("Website relaunch");
    expect(insights.clientLabel).toBe("Atlas Creative");
    expect(insights.statusLabel).toBe("In progress");
    expect(insights.budgetLabel).toBe("10,000 budget");
    expect(insights.spentLabel).toBe("2,500 spent");
    expect(insights.budgetProgressPercent).toBe(25);
    expect(insights.timelineLabel).toContain("2026");
    expect(insights.missingEssentials).toEqual([]);
    expect(insights.nextActionLabel).toBe("Save, then add project tasks");
  });

  it("surfaces missing essentials for a new draft", () => {
    const insights = buildProjectFormInsights({
      values: projectValues(),
      clients,
    });

    expect(insights.title).toBe("Untitled project");
    expect(insights.clientLabel).toBe("No client selected");
    expect(insights.budgetLabel).toBe("No budget yet");
    expect(insights.timelineLabel).toBe("No timeline yet");
    expect(insights.missingEssentials).toEqual([
      "Select a client",
      "Add a project title",
      "Add budget or timeline context",
    ]);
    expect(insights.nextActionLabel).toBe("Complete the required project basics");
  });
});
