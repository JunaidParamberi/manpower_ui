import { describe, expect, it } from "vitest";
import { monthGrid, relativeDays } from "./calendar-grid";

describe("monthGrid", () => {
  it("starts on the Monday on or before the 1st and has 42 days", () => {
    const g = monthGrid(2026, 9); // October 2026; 1 Oct is a Thursday
    expect(g).toHaveLength(42);
    expect(g[0]).toBe("2026-09-28");
    expect(g[3]).toBe("2026-10-01");
  });
  it("handles a month starting on Monday", () => {
    expect(monthGrid(2026, 5)[0]).toBe("2026-06-01");
  });
});

describe("relativeDays", () => {
  it("formats relative distance", () => {
    expect(relativeDays("2026-10-09", "2026-10-09")).toBe("today");
    expect(relativeDays("2026-11-08", "2026-10-09")).toBe("in 30d");
    expect(relativeDays("2026-10-06", "2026-10-09")).toBe("3d ago");
  });
});
