import { describe, expect, it } from "vitest";
import {
  computeGanttBars,
  shiftBarDates,
  dateRangeSpan,
  GANTT_DAY_WIDTH_PX,
  daysBetween,
  dayOffsetPx,
  pxDeltaToDayDelta,
  enumerateDays,
} from "./project-gantt";

describe("computeGanttBars", () => {
  it("excludes tasks with no due_date", () => {
    const bars = computeGanttBars([
      {
        id: "1",
        title: "No dates",
        status: "todo",
        start_date: null,
        due_date: null,
        parent_task_id: null,
      },
    ]);
    expect(bars).toEqual([]);
  });

  it("excludes subtasks (non-null parent_task_id)", () => {
    const bars = computeGanttBars([
      {
        id: "1",
        title: "Subtask",
        status: "todo",
        start_date: "2026-08-01",
        due_date: "2026-08-05",
        parent_task_id: "parent-1",
      },
    ]);
    expect(bars).toEqual([]);
  });

  it("uses start_date and due_date directly when both present", () => {
    const bars = computeGanttBars([
      {
        id: "1",
        title: "Design phase",
        status: "in_progress",
        start_date: "2026-08-01",
        due_date: "2026-08-05",
        parent_task_id: null,
      },
    ]);
    expect(bars).toEqual([
      {
        taskId: "1",
        title: "Design phase",
        status: "in_progress",
        startDate: "2026-08-01",
        dueDate: "2026-08-05",
      },
    ]);
  });

  it("derives a 1-day bar ending on due_date when start_date is missing", () => {
    const bars = computeGanttBars([
      {
        id: "1",
        title: "Send invoice",
        status: "todo",
        start_date: null,
        due_date: "2026-08-10",
        parent_task_id: null,
      },
    ]);
    expect(bars).toEqual([
      {
        taskId: "1",
        title: "Send invoice",
        status: "todo",
        startDate: "2026-08-09",
        dueDate: "2026-08-10",
      },
    ]);
  });

  it("derives the 1-day bar correctly across a month boundary", () => {
    const bars = computeGanttBars([
      {
        id: "1",
        title: "Month edge",
        status: "todo",
        start_date: null,
        due_date: "2026-09-01",
        parent_task_id: null,
      },
    ]);
    expect(bars[0]).toMatchObject({
      startDate: "2026-08-31",
      dueDate: "2026-09-01",
    });
  });
});

describe("shiftBarDates", () => {
  it("shifts both dates forward by the day delta, preserving duration", () => {
    const result = shiftBarDates("2026-08-01", "2026-08-05", 3);
    expect(result).toEqual({ start_date: "2026-08-04", due_date: "2026-08-08" });
  });

  it("shifts both dates backward for a negative delta", () => {
    const result = shiftBarDates("2026-08-10", "2026-08-12", -5);
    expect(result).toEqual({ start_date: "2026-08-05", due_date: "2026-08-07" });
  });

  it("returns the same dates for a zero delta", () => {
    const result = shiftBarDates("2026-08-10", "2026-08-12", 0);
    expect(result).toEqual({ start_date: "2026-08-10", due_date: "2026-08-12" });
  });

  it("crosses a year boundary correctly", () => {
    const result = shiftBarDates("2026-12-30", "2026-12-31", 3);
    expect(result).toEqual({ start_date: "2027-01-02", due_date: "2027-01-03" });
  });
});

describe("dateRangeSpan", () => {
  it("returns null for an empty bar list", () => {
    expect(dateRangeSpan([], 3)).toBeNull();
  });

  it("spans from the earliest start to the latest due date, padded", () => {
    const result = dateRangeSpan(
      [
        { startDate: "2026-08-05", dueDate: "2026-08-10" },
        { startDate: "2026-08-01", dueDate: "2026-08-03" },
        { startDate: "2026-08-20", dueDate: "2026-08-25" },
      ],
      2,
    );
    expect(result).toEqual({ rangeStart: "2026-07-30", rangeEnd: "2026-08-27" });
  });
});

describe("daysBetween", () => {
  it("returns 0 for the same date", () => {
    expect(daysBetween("2026-08-01", "2026-08-01")).toBe(0);
  });

  it("returns a positive count when toDate is later", () => {
    expect(daysBetween("2026-08-01", "2026-08-05")).toBe(4);
  });

  it("returns a negative count when toDate is earlier", () => {
    expect(daysBetween("2026-08-05", "2026-08-01")).toBe(-4);
  });
});

describe("dayOffsetPx", () => {
  it("returns 0 at the range start", () => {
    expect(dayOffsetPx("2026-08-01", "2026-08-01")).toBe(0);
  });

  it("returns day count times GANTT_DAY_WIDTH_PX", () => {
    expect(dayOffsetPx("2026-08-01", "2026-08-04")).toBe(3 * GANTT_DAY_WIDTH_PX);
  });
});

describe("pxDeltaToDayDelta", () => {
  it("rounds to the nearest whole day", () => {
    expect(pxDeltaToDayDelta(GANTT_DAY_WIDTH_PX * 2)).toBe(2);
    expect(pxDeltaToDayDelta(GANTT_DAY_WIDTH_PX * 2.4)).toBe(2);
    expect(pxDeltaToDayDelta(GANTT_DAY_WIDTH_PX * 2.6)).toBe(3);
    expect(pxDeltaToDayDelta(-GANTT_DAY_WIDTH_PX * 1.5)).toBe(-2);
  });

  it("returns 0 for a delta smaller than half a day-width", () => {
    expect(pxDeltaToDayDelta(GANTT_DAY_WIDTH_PX * 0.4)).toBe(0);
  });
});

describe("enumerateDays", () => {
  it("returns a single-element array when start equals end", () => {
    expect(enumerateDays("2026-08-01", "2026-08-01")).toEqual(["2026-08-01"]);
  });

  it("enumerates every date inclusive of both ends", () => {
    expect(enumerateDays("2026-08-01", "2026-08-04")).toEqual([
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
    ]);
  });

  it("crosses a month boundary correctly", () => {
    expect(enumerateDays("2026-08-30", "2026-09-01")).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
    ]);
  });

  it("returns an empty array when rangeEnd is before rangeStart", () => {
    expect(enumerateDays("2026-08-05", "2026-08-01")).toEqual([]);
  });
});
