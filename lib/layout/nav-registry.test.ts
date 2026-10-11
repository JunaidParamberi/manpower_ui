import { describe, expect, it } from "vitest";

import {
  NAV_ITEM_IDS,
  NAV_SECTION_ITEM_IDS,
  groupNavOrderBySection,
  mergeNavLayout,
} from "@/lib/layout/nav-registry";

describe("mergeNavLayout", () => {
  it("returns the full default order when nothing is stored", () => {
    const result = mergeNavLayout([], []);
    expect(result.order).toEqual([...NAV_ITEM_IDS]);
    expect(result.hidden).toEqual([]);
  });

  it("preserves a stored order for known ids", () => {
    const stored = [...NAV_ITEM_IDS].reverse();
    const result = mergeNavLayout(stored, []);
    expect(result.order).toEqual(stored);
  });

  it("drops unknown ids from a stored order", () => {
    const result = mergeNavLayout(["tasks", "some_removed_item", "dashboard"], []);
    expect(result.order[0]).toBe("tasks");
    expect(result.order[1]).toBe("dashboard");
    expect(result.order).not.toContain("some_removed_item");
    expect(result.order).toHaveLength(NAV_ITEM_IDS.length);
  });

  it("appends new item ids not present in a stored order", () => {
    const result = mergeNavLayout(["tasks", "dashboard"], []);
    expect(result.order[0]).toBe("tasks");
    expect(result.order[1]).toBe("dashboard");
    expect(result.order).toContain("finance");
    expect(result.order).toHaveLength(NAV_ITEM_IDS.length);
  });

  it("filters stored hidden ids down to known items", () => {
    const result = mergeNavLayout([], ["services", "some_removed_item"]);
    expect(result.hidden).toEqual(["services"]);
  });
});

describe("groupNavOrderBySection", () => {
  it("groups the default order back into the original sections", () => {
    const { order } = mergeNavLayout([], []);
    expect(groupNavOrderBySection(order)).toEqual(NAV_SECTION_ITEM_IDS.map((ids) => [...ids]));
  });

  it("keeps items grouped by their fixed section even after a cross-section-looking stored order", () => {
    // "finance" (section 3) listed before "tasks" (section 1) in storage —
    // grouping must still place each id under its real section.
    const result = mergeNavLayout(["finance", "tasks", "dashboard"], []);
    const grouped = groupNavOrderBySection(result.order);
    expect(grouped[0]).toEqual(["tasks", "dashboard", "time"]);
    expect(grouped[2][0]).toBe("finance");
  });
});
