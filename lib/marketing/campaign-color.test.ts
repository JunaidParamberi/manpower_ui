import { describe, expect, it } from "vitest";

import {
  CAMPAIGN_COLOR_CLASSES,
  campaignColorClass,
  campaignColorIndex,
} from "./campaign-color";

const ID_A = "11111111-2222-3333-4444-555555555555";
const ID_B = "66666666-7777-8888-9999-aaaaaaaaaaaa";

describe("campaignColorIndex", () => {
  it("is deterministic for the same id", () => {
    expect(campaignColorIndex(ID_A)).toBe(campaignColorIndex(ID_A));
  });

  it("always lands inside the palette", () => {
    for (const id of [ID_A, ID_B, "x", "", "a-very-long-id-".repeat(10)]) {
      const index = campaignColorIndex(id);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(CAMPAIGN_COLOR_CLASSES.length);
    }
  });

  it("spreads a realistic set of ids across more than one colour", () => {
    const ids = Array.from(
      { length: 40 },
      (_, i) => `0000000${i}-2222-3333-4444-555555555555`,
    );
    const used = new Set(ids.map(campaignColorIndex));
    expect(used.size).toBeGreaterThan(1);
  });
});

describe("campaignColorClass", () => {
  it("returns a palette class for an id", () => {
    expect(CAMPAIGN_COLOR_CLASSES).toContain(campaignColorClass(ID_A));
  });

  it("returns a transparent stripe for a post with no campaign", () => {
    expect(campaignColorClass(null)).toBe("bg-transparent");
  });
});
