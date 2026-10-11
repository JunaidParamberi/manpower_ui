import { describe, expect, it } from "vitest";

import {
  getProjectChipRisk,
  isProjectAtRisk,
  projectBudgetProgress,
} from "@/lib/projects/project-utils";
import type { ProjectListRow } from "@/types";

function project(
  overrides: Partial<ProjectListRow> = {},
): ProjectListRow {
  return {
    id: "p1",
    user_id: "u1",
    client_id: "c1",
    title: "Test",
    status: "active",
    budget: 10000,
    spent: 6800,
    hourly_rate: null,
    start_date: null,
    deadline: null,
    created_at: "",
    updated_at: "",
    client: { id: "c1", name: "Client" },
    ...overrides,
  };
}

describe("isProjectAtRisk", () => {
  it("returns false when not active", () => {
    expect(
      isProjectAtRisk(project({ status: "planning", deadline: "2026-05-20" })),
    ).toBe(false);
  });

  it("returns true when active and deadline within 7 days", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const iso = soon.toISOString().slice(0, 10);
    expect(isProjectAtRisk(project({ status: "active", deadline: iso }))).toBe(
      true,
    );
  });

  it("returns true when active and deadline is past due", () => {
    expect(
      isProjectAtRisk(project({ status: "active", deadline: "2020-01-01" })),
    ).toBe(true);
  });
});

describe("getProjectChipRisk", () => {
  it("returns danger when at risk", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 2);
    expect(
      getProjectChipRisk(
        project({ status: "active", deadline: soon.toISOString().slice(0, 10) }),
      ),
    ).toBe("danger");
  });

  it("returns warning for on_hold", () => {
    expect(getProjectChipRisk(project({ status: "on_hold" }))).toBe("warning");
  });
});

describe("projectBudgetProgress", () => {
  it("computes spent over budget", () => {
    expect(projectBudgetProgress(project({ budget: 100, spent: 68 }))).toBe(0.68);
  });

  it("returns 0 when no budget", () => {
    expect(projectBudgetProgress(project({ budget: null, spent: 50 }))).toBe(0);
  });
});
