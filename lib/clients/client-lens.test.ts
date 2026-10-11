import { describe, expect, it } from "vitest";

import { clientGroupOf, countClientLenses, matchesClientLens, parseClientLens } from "./client-lens";

const now = "2026-10-09T10:00:00.000Z";
const c = (o: Partial<{ health_score: number | null; overdue_total: number; last_activity_at: string | null }>) => ({
  health_score: 90,
  overdue_total: 0,
  last_activity_at: "2026-10-01T00:00:00.000Z",
  ...o,
});

describe("clientGroupOf", () => {
  it("needs you when anything is overdue, even with a great score", () => {
    expect(clientGroupOf(c({ overdue_total: 10 }), now)).toBe("needs-you");
  });
  it("needs you when the score is in the needs-attention or at-risk band (under 55)", () => {
    expect(clientGroupOf(c({ health_score: 54 }), now)).toBe("needs-you");
  });
  it("healthy at exactly 55 with recent activity", () => {
    expect(clientGroupOf(c({ health_score: 55 }), now)).toBe("healthy");
  });
  it("quiet when last activity is more than 60 days ago", () => {
    expect(clientGroupOf(c({ last_activity_at: "2026-08-09T00:00:00.000Z" }), now)).toBe("quiet");
  });
  it("not quiet at exactly 60 days", () => {
    expect(clientGroupOf(c({ last_activity_at: "2026-08-10T00:00:00.000Z" }), now)).toBe("healthy");
  });
  it("quiet when there is no activity at all", () => {
    expect(clientGroupOf(c({ health_score: null, last_activity_at: null }), now)).toBe("quiet");
  });
  it("other for an unscored, recently active client", () => {
    expect(clientGroupOf(c({ health_score: null }), now)).toBe("other");
  });
});

describe("lens counts and matching", () => {
  const rows = [c({ overdue_total: 5 }), c({}), c({ last_activity_at: null }), c({ health_score: null })];
  it("counts every lens; all includes other", () => {
    expect(countClientLenses(rows, now)).toEqual({ all: 4, "needs-you": 1, healthy: 1, quiet: 1 });
  });
  it("all matches everything", () => {
    expect(rows.every((r) => matchesClientLens(r, "all", now))).toBe(true);
  });
  it("a lens matches only its group", () => {
    expect(rows.filter((r) => matchesClientLens(r, "quiet", now))).toHaveLength(1);
  });
});

describe("parseClientLens", () => {
  it.each<[string | null, string]>([
    ["needs-you", "needs-you"],
    ["healthy", "healthy"],
    ["quiet", "quiet"],
    [null, "all"],
    ["at-risk", "all"],
    ["", "all"],
  ])("%s → %s", (input, expected) => {
    expect(parseClientLens(input)).toBe(expected);
  });
});
