import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  buildWeekGrid,
  groupPostsByDay,
  monthLabel,
  rollMonth,
  rollWeek,
  weekRangeLabel,
} from "./calendar-utils";

describe("buildMonthGrid", () => {
  it("always returns 42 cells", () => {
    expect(buildMonthGrid(2026, 6)).toHaveLength(42); // July 2026 (month0=6)
  });

  it("marks in-month vs spill days", () => {
    const grid = buildMonthGrid(2026, 6);
    const july1 = grid.find((d) => d.iso === "2026-07-01");
    expect(july1?.inMonth).toBe(true);
    expect(grid[0].inMonth).toBe(false); // leading spill from June
  });
});

describe("groupPostsByDay", () => {
  it("buckets posts by local scheduled day and skips nulls", () => {
    // Build timestamps from local Date parts (not a hardcoded UTC string)
    // so this test is correct regardless of the machine's timezone —
    // groupPostsByDay buckets by local time to match the write path
    // (content-post-sheet builds scheduledAt from local Date parts).
    const a = new Date(2026, 6, 10, 9, 0, 0);
    const b = new Date(2026, 6, 10, 15, 0, 0);
    const posts = [
      { id: "a", scheduledAt: a.toISOString() },
      { id: "b", scheduledAt: b.toISOString() },
      { id: "c", scheduledAt: null },
    ];
    const grouped = groupPostsByDay(posts);
    const key = `2026-07-${String(a.getDate()).padStart(2, "0")}`;
    expect(grouped[key]).toHaveLength(2);
    expect(Object.values(grouped).flat()).toHaveLength(2);
  });

  it("keys by local calendar day even when UTC day would differ", () => {
    // A timestamp whose UTC day differs from its local day (near local
    // midnight) must still bucket under the local day.
    const late = new Date(2026, 6, 10, 23, 30, 0);
    const posts = [{ id: "a", scheduledAt: late.toISOString() }];
    const grouped = groupPostsByDay(posts);
    const key = `2026-07-${String(late.getDate()).padStart(2, "0")}`;
    expect(grouped[key]).toHaveLength(1);
  });
});

describe("buildWeekGrid", () => {
  it("returns exactly 7 consecutive days from the anchor", () => {
    const grid = buildWeekGrid("2026-06-15", null);
    expect(grid).toHaveLength(7);
    expect(grid.map((d) => d.iso)).toEqual([
      "2026-06-15",
      "2026-06-16",
      "2026-06-17",
      "2026-06-18",
      "2026-06-19",
      "2026-06-20",
      "2026-06-21",
    ]);
  });

  it("treats every day as in-view", () => {
    // A week spanning a month boundary still has no greyed-out cells: in week
    // view there is no "other month" to spill into.
    const grid = buildWeekGrid("2026-06-29", null);
    expect(grid.map((d) => d.iso)).toEqual([
      "2026-06-29",
      "2026-06-30",
      "2026-07-01",
      "2026-07-02",
      "2026-07-03",
      "2026-07-04",
      "2026-07-05",
    ]);
    expect(grid.every((d) => d.inMonth)).toBe(true);
  });

  it("marks today by local calendar day", () => {
    const today = new Date(2026, 5, 17, 23, 45);
    const grid = buildWeekGrid("2026-06-15", today);
    expect(grid.filter((d) => d.isToday).map((d) => d.iso)).toEqual([
      "2026-06-17",
    ]);
  });

  it("marks nothing as today when today is null (pre-hydration)", () => {
    expect(buildWeekGrid("2026-06-15", null).some((d) => d.isToday)).toBe(false);
  });
});

describe("rollWeek", () => {
  it("moves whole weeks in both directions", () => {
    expect(rollWeek("2026-06-15", 1)).toBe("2026-06-22");
    expect(rollWeek("2026-06-15", -1)).toBe("2026-06-08");
  });

  it("crosses month and year boundaries", () => {
    expect(rollWeek("2026-06-29", 1)).toBe("2026-07-06");
    expect(rollWeek("2026-12-28", 1)).toBe("2027-01-04");
  });
});

describe("rollMonth", () => {
  it("moves whole months in both directions", () => {
    expect(rollMonth("2026-06", 1)).toBe("2026-07");
    expect(rollMonth("2026-06", -1)).toBe("2026-05");
  });

  it("crosses year boundaries", () => {
    expect(rollMonth("2026-12", 1)).toBe("2027-01");
    expect(rollMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("labels", () => {
  it("formats a month", () => {
    expect(monthLabel("2026-06")).toBe("June 2026");
  });

  it("formats a same-month week range compactly", () => {
    expect(weekRangeLabel("2026-06-15")).toBe("Jun 15 – 21, 2026");
  });

  it("spells out both months when a week spans two", () => {
    expect(weekRangeLabel("2026-06-29")).toBe("Jun 29 – Jul 5, 2026");
  });
});
