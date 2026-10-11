import { describe, it, expect } from "vitest";
import { groupEntriesByDay } from "./import-billing";

type E = { id: string; started_at: string; duration_seconds: number };

const e = (id: string, started_at: string, duration_seconds: number): E => ({
  id,
  started_at,
  duration_seconds,
});

describe("groupEntriesByDay", () => {
  it("returns empty array for no entries", () => {
    expect(groupEntriesByDay([])).toEqual([]);
  });

  it("groups single entry into one day", () => {
    const result = groupEntriesByDay([e("a", "2026-06-10T09:00:00Z", 3600)]);
    expect(result).toEqual([
      { date: "2026-06-10", totalSeconds: 3600, entryIds: ["a"] },
    ]);
  });

  it("sums entries on the same day", () => {
    const result = groupEntriesByDay([
      e("a", "2026-06-10T09:00:00Z", 3600),
      e("b", "2026-06-10T14:00:00Z", 1800),
    ]);
    expect(result).toEqual([
      { date: "2026-06-10", totalSeconds: 5400, entryIds: ["a", "b"] },
    ]);
  });

  it("produces separate groups for different days", () => {
    const result = groupEntriesByDay([
      e("a", "2026-06-10T09:00:00Z", 3600),
      e("b", "2026-06-11T09:00:00Z", 7200),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe("2026-06-10");
    expect(result[1].date).toBe("2026-06-11");
  });

  it("returns groups sorted ascending by date", () => {
    const result = groupEntriesByDay([
      e("b", "2026-06-12T09:00:00Z", 1800),
      e("a", "2026-06-10T09:00:00Z", 3600),
    ]);
    expect(result[0].date).toBe("2026-06-10");
    expect(result[1].date).toBe("2026-06-12");
  });

  it("uses the UTC date from started_at", () => {
    const result = groupEntriesByDay([e("a", "2026-06-10T23:30:00Z", 3600)]);
    expect(result[0].date).toBe("2026-06-10");
  });
});
