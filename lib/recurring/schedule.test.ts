import { describe, it, expect } from "vitest";
import { advanceDate, periodFor, nextRunAfter } from "./schedule";
import type { ScheduleState } from "./schedule";

describe("advanceDate", () => {
  it("adds one week", () => {
    expect(advanceDate("2026-06-10", "weekly", 1)).toBe("2026-06-17");
  });

  it("adds two weeks (fortnightly)", () => {
    expect(advanceDate("2026-06-10", "weekly", 2)).toBe("2026-06-24");
  });

  it("adds one month", () => {
    expect(advanceDate("2026-06-10", "monthly", 1)).toBe("2026-07-10");
  });

  it("adds three months (quarterly)", () => {
    expect(advanceDate("2026-01-15", "monthly", 3)).toBe("2026-04-15");
  });

  it("clamps Jan 31 + 1 month to Feb 28 in non-leap year", () => {
    expect(advanceDate("2025-01-31", "monthly", 1)).toBe("2025-02-28");
  });

  it("clamps Jan 31 + 1 month to Feb 29 in leap year", () => {
    expect(advanceDate("2024-01-31", "monthly", 1)).toBe("2024-02-29");
  });

  it("adds one day", () => {
    expect(advanceDate("2026-06-10", "daily", 1)).toBe("2026-06-11");
  });

  it("adds one year", () => {
    expect(advanceDate("2026-06-10", "yearly", 1)).toBe("2027-06-10");
  });

  it("advances Feb 29 by one year in leap year context", () => {
    expect(advanceDate("2024-02-29", "yearly", 1)).toBe("2025-02-28");
  });
});

describe("periodFor", () => {
  it("returns period start and end for weekly", () => {
    expect(periodFor("2026-06-10", "weekly", 1)).toEqual({
      periodStart: "2026-06-10",
      periodEnd: "2026-06-17",
    });
  });

  it("returns period start and end for monthly", () => {
    expect(periodFor("2026-06-01", "monthly", 1)).toEqual({
      periodStart: "2026-06-01",
      periodEnd: "2026-07-01",
    });
  });
});

describe("nextRunAfter", () => {
  const base: ScheduleState = {
    interval: "monthly",
    interval_count: 1,
    next_run_at: "2026-06-01",
    end_date: null,
    occurrences_limit: null,
    occurrences_count: 0,
  };

  it("advances by one interval when no limits", () => {
    expect(nextRunAfter(base, "2026-06-01")).toBe("2026-07-01");
  });

  it("returns null when next run exceeds end_date", () => {
    expect(
      nextRunAfter({ ...base, end_date: "2026-06-15" }, "2026-06-01"),
    ).toBeNull();
  });

  it("returns null when occurrences_limit reached after this run", () => {
    expect(
      nextRunAfter(
        { ...base, occurrences_limit: 1, occurrences_count: 0 },
        "2026-06-01",
      ),
    ).toBeNull();
  });

  it("still advances when under occurrences_limit", () => {
    expect(
      nextRunAfter(
        {
          ...base,
          next_run_at: "2026-07-01",
          occurrences_limit: 3,
          occurrences_count: 1,
        },
        "2026-07-01",
      ),
    ).toBe("2026-08-01");
  });
});
