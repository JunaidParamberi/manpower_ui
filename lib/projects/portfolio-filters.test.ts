import { describe, expect, it } from "vitest";

import type { PortfolioProject } from "./portfolio-summary";
import { applyPatches, filterPortfolio, groupForList, lensCounts, matchesSearch, parseLens, resolveSelection, selectForList, withPace } from "./portfolio-filters";

const TODAY = "2026-10-08";
function project(over: Partial<PortfolioProject> & { id: string }): PortfolioProject {
  return {
    user_id: "u", client_id: "c", title: `Project ${over.id}`, status: "active", budget: null, spent: 0, hourly_rate: null,
    start_date: "2026-09-01", deadline: "2026-12-31", created_at: "2026-08-01T00:00:00Z", updated_at: "2026-08-01T00:00:00Z",
    client: { id: "c", name: "Cedar Media LLC" }, taskDone: 1, taskTotal: 2, spend: 0, nextTask: null, milestones: [],
    ...over,
  };
}
const P = withPace([
  project({ id: "late", deadline: "2026-09-01", taskDone: 0, taskTotal: 4 }),
  project({ id: "fine", title: "Website build" }),
  project({ id: "plan", status: "planning" }),
  project({ id: "hold", status: "on_hold" }),
  project({ id: "done", status: "completed" }),
], TODAY);

describe("portfolio filters", () => {
  it("parses lenses with a safe default", () => {
    expect(parseLens("needs_you")).toBe("needs_you");
    expect(parseLens("nope")).toBe("all");
    expect(parseLens(null)).toBe("all");
  });

  it("counts every lens", () => {
    expect(lensCounts(P)).toEqual({ all: 5, needs_you: 1, active: 2, planning: 1, done: 1 });
  });

  it("filters by lens and search together", () => {
    expect(filterPortfolio(P, "active", "").map((p) => p.id)).toEqual(["late", "fine"]);
    expect(filterPortfolio(P, "all", "website").map((p) => p.id)).toEqual(["fine"]);
  });

  it("searches title and client, case-insensitive, trimmed", () => {
    expect(matchesSearch(P[0], "  CEDAR ")).toBe(true);
    expect(matchesSearch(P[0], "zzz")).toBe(false);
  });

  it("groups for the list in a fixed order and skips empty groups", () => {
    expect(groupForList(P).map((g) => [g.id, g.projects.map((p) => p.id)])).toEqual([
      ["needs_you", ["late"]], ["on_track", ["fine"]], ["planning", ["plan"]], ["on_hold", ["hold"]], ["done", ["done"]],
    ]);
  });

  it("resolves the selection with a fallback to the first listed project", () => {
    expect(resolveSelection(P, "fine")).toEqual({ id: "fine", invalid: false });
    expect(resolveSelection(P, "missing")).toEqual({ id: "late", invalid: true });
    expect(resolveSelection(P, null)).toEqual({ id: "late", invalid: false });
    expect(resolveSelection([], "x")).toEqual({ id: null, invalid: true });
  });

  it("keeps a valid link quiet when the lens hides it", () => {
    const visible = filterPortfolio(P, "planning", "");
    expect(selectForList(P, visible, "fine")).toEqual({ id: "plan", invalid: false });
    expect(selectForList(P, visible, "plan")).toEqual({ id: "plan", invalid: false });
    expect(selectForList(P, visible, "gone")).toEqual({ id: "plan", invalid: true });
    expect(selectForList(P, [], "fine")).toEqual({ id: null, invalid: false });
  });

  it("applies optimistic patches and recomputes pace", () => {
    const next = applyPatches(P, [{ id: "plan", status: "active" }, { id: "fine", deadline: "2026-09-01" }], TODAY);
    expect(next.find((p) => p.id === "plan")?.status).toBe("active");
    expect(next.find((p) => p.id === "fine")?.pace.kind).toBe("late");
    expect(next).toHaveLength(5);
  });
});
