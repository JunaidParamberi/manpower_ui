import { describe, expect, it } from "vitest";
import { cadenceToDayOffsets } from "./cadence";

describe("cadenceToDayOffsets", () => {
  it("spreads N posts across a 2-week window", () => {
    const offs = cadenceToDayOffsets("2026-08-01", "2026-08-14", 3); // 3/week * 2 weeks = 6
    expect(offs).toHaveLength(6);
    expect(offs[0]).toBeGreaterThanOrEqual(0);
    expect(offs[offs.length - 1]).toBeLessThanOrEqual(13);
    expect([...offs]).toEqual([...offs].sort((a, b) => a - b)); // ascending
  });

  it("returns at least one offset for a single-day window", () => {
    expect(cadenceToDayOffsets("2026-08-01", "2026-08-01", 7)).toEqual([0]);
  });
});
