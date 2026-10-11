import { describe, expect, it } from "vitest";

import { DASHBOARD_CARD_IDS, mergeDashboardLayout } from "@/lib/dashboard/layout-registry";

describe("mergeDashboardLayout", () => {
  it("returns the full default order when nothing is stored", () => {
    const result = mergeDashboardLayout([], []);
    expect(result.order).toEqual([...DASHBOARD_CARD_IDS]);
    expect(result.hidden).toEqual([]);
  });

  it("preserves a stored order for known ids", () => {
    const stored = [...DASHBOARD_CARD_IDS].reverse();
    const result = mergeDashboardLayout(stored, []);
    expect(result.order).toEqual(stored);
  });

  it("drops unknown ids from a stored order", () => {
    const result = mergeDashboardLayout(["queue", "some_removed_card", "brief"], []);
    expect(result.order).toEqual([
      "queue",
      "brief",
      "revenue",
      "activity",
      "work",
      "clients",
    ]);
  });

  it("appends new card ids not present in a stored order", () => {
    const result = mergeDashboardLayout(["queue", "brief"], []);
    expect(result.order[0]).toBe("queue");
    expect(result.order[1]).toBe("brief");
    expect(result.order).toContain("activity");
    expect(result.order).toHaveLength(DASHBOARD_CARD_IDS.length);
  });

  it("dedupes a stored order with a repeated id", () => {
    const result = mergeDashboardLayout(["queue", "queue", "brief"], []);
    expect(result.order.filter((id) => id === "queue")).toHaveLength(1);
    expect(result.order).toHaveLength(DASHBOARD_CARD_IDS.length);
  });

  it("filters stored hidden ids down to known cards", () => {
    const result = mergeDashboardLayout([], ["queue", "some_removed_card"]);
    expect(result.hidden).toEqual(["queue"]);
  });
});
