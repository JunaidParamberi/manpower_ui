import { describe, expect, it } from "vitest";

import { addDays, barGeometry, fracOf, parseZoom, pxToDays, shiftDates, timelineWindow } from "./portfolio-timeline";

describe("portfolio timeline", () => {
  it("parses zoom with a 6-month default", () => {
    expect(parseZoom("3")).toBe(3);
    expect(parseZoom("12")).toBe(12);
    expect(parseZoom("7")).toBe(6);
  });

  it("starts the window on a month boundary before today", () => {
    const w = timelineWindow("2026-10-08", 6);
    expect(w.start).toBe("2026-08-01");
    expect(w.end).toBe("2027-02-01");
    expect(w.months.map((m) => m.label)).toEqual(["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"]);
    expect(w.months.find((m) => m.isCurrent)?.label).toBe("Oct");
    expect(w.months.reduce((s, m) => s + m.widthFrac, 0)).toBeCloseTo(1, 6);
  });

  it("opens earlier to fit the earliest project, up to zoom - 1 months back", () => {
    expect(timelineWindow("2026-10-08", 6, "2026-07-01").start).toBe("2026-07-01");
    expect(timelineWindow("2026-10-08", 6, "2025-01-01").start).toBe("2026-05-01");
    expect(timelineWindow("2026-10-08", 6, "2026-12-01").start).toBe("2026-08-01");
  });

  it("clamps bars to the window and marks clipped edges", () => {
    const w = timelineWindow("2026-10-08", 6);
    const g = barGeometry(w, "2026-07-01", "2026-09-01");
    expect(g.left).toBe(0);
    expect(g.clippedStart).toBe(true);
    expect(g.clippedEnd).toBe(false);
    expect(g.width).toBeCloseTo(fracOf(w, "2026-09-02"), 6);
  });

  it("draws a same-day project as a one-day bar", () => {
    const w = timelineWindow("2026-10-08", 6);
    const g = barGeometry(w, "2026-10-08", "2026-10-08");
    expect(g.visible).toBe(true);
    expect(g.width).toBeCloseTo(1 / w.totalDays, 6);
  });

  it("hides bars fully outside the window", () => {
    const w = timelineWindow("2026-10-08", 6);
    expect(barGeometry(w, "2025-01-01", "2025-02-01").visible).toBe(false);
    expect(barGeometry(w, "2025-01-01", "2025-02-01").width).toBe(0);
  });

  it("shifts dates by edge and never inverts them", () => {
    expect(shiftDates("2026-10-01", "2026-10-10", 3, "move")).toEqual({ start: "2026-10-04", end: "2026-10-13" });
    expect(shiftDates("2026-10-01", "2026-10-10", 20, "start")).toEqual({ start: "2026-10-10", end: "2026-10-10" });
    expect(shiftDates("2026-10-01", "2026-10-10", -20, "end")).toEqual({ start: "2026-10-01", end: "2026-10-01" });
  });

  it("converts pixels to whole days", () => {
    expect(pxToDays(100, 1000, 184)).toBe(18);
    expect(pxToDays(-4, 1000, 184)).toBe(-1);
    expect(pxToDays(1, 0, 184)).toBe(0);
  });

  it("adds days across month ends", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });
});
