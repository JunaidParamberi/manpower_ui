import { describe, expect, it } from "vitest";
import {
  currentMonthRange,
  lastNMonthsRange,
  yearToDateRange,
  previousPeriodRange,
  parseDateRangeParams,
  formatDateParam,
  rangeCacheKey,
  rangeFromCacheKey,
  parseRevenueRangeParam,
  revenueRange,
} from "./date-utils";

describe("currentMonthRange", () => {
  it("returns start of current month as from and now as to", () => {
    const { from, to } = currentMonthRange();
    expect(from.getDate()).toBe(1);
    expect(from.getHours()).toBe(0);
    expect(to.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });
});

describe("lastNMonthsRange", () => {
  it("returns a range spanning exactly N months back from today", () => {
    const { from, to } = lastNMonthsRange(3);
    const diffMs = to.getTime() - from.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(80);
    expect(diffDays).toBeLessThan(95);
  });
});

describe("yearToDateRange", () => {
  it("starts on Jan 1 of the current year", () => {
    const { from } = yearToDateRange();
    expect(from.getMonth()).toBe(0);
    expect(from.getDate()).toBe(1);
    expect(from.getFullYear()).toBe(new Date().getFullYear());
  });
});

describe("parseDateRangeParams", () => {
  it("returns currentMonthRange when both params are absent", () => {
    const range = parseDateRangeParams(undefined, undefined);
    expect(range.from.getDate()).toBe(1);
  });

  it("parses valid ISO date strings", () => {
    const range = parseDateRangeParams("2026-01-01", "2026-03-31");
    expect(range.from.getFullYear()).toBe(2026);
    expect(range.from.getMonth()).toBe(0);
    expect(range.to.getMonth()).toBe(2);
  });

  it("falls back to currentMonthRange when params are invalid", () => {
    const range = parseDateRangeParams("not-a-date", "also-bad");
    expect(range.from.getDate()).toBe(1);
  });
});

describe("previousPeriodRange", () => {
  it("returns a range of equal duration immediately before the given range", () => {
    const from = new Date("2026-03-01T00:00:00Z");
    const to = new Date("2026-03-31T00:00:00Z");
    const prev = previousPeriodRange({ from, to });
    const duration = to.getTime() - from.getTime();
    expect(prev.to.getTime()).toBe(from.getTime());
    expect(prev.to.getTime() - prev.from.getTime()).toBe(duration);
  });
});

describe("formatDateParam", () => {
  it("formats a date as YYYY-MM-DD", () => {
    const d = new Date(2026, 0, 15); // Jan 15 2026
    expect(formatDateParam(d)).toBe("2026-01-15");
  });
});

describe("rangeCacheKey / rangeFromCacheKey", () => {
  it("collapses a live timestamp to a stable day key", () => {
    // Same local calendar day, hours apart — the key must not move.
    const from = new Date(2026, 8, 1, 0, 0, 0);
    const morning = rangeCacheKey({ from, to: new Date(2026, 8, 10, 7, 11, 52) });
    const evening = rangeCacheKey({ from, to: new Date(2026, 8, 10, 21, 44, 3) });
    expect(morning).toEqual(evening);
    expect(morning.toDay).toBe("2026-09-10");
  });

  it("round-trips day keys back into a full-day range", () => {
    const range = rangeFromCacheKey("2026-09-01", "2026-09-10");
    expect(range.from.getHours()).toBe(0);
    expect(range.to.getHours()).toBe(23);
    expect(range.to.getMinutes()).toBe(59);
  });
});

describe("parseRevenueRangeParam", () => {
  it("defaults to 6m for missing or unknown values", () => {
    expect(parseRevenueRangeParam(undefined)).toBe("6m");
    expect(parseRevenueRangeParam("nonsense")).toBe("6m");
  });

  it("accepts the known range ids", () => {
    expect(parseRevenueRangeParam("1y")).toBe("1y");
    expect(parseRevenueRangeParam("all")).toBe("all");
  });
});

describe("revenueRange", () => {
  it("spans a wider window as the range grows", () => {
    const sixMonths = revenueRange("6m");
    const oneYear = revenueRange("1y");
    const all = revenueRange("all");
    expect(oneYear.from.getTime()).toBeLessThan(sixMonths.from.getTime());
    expect(all.from.getTime()).toBeLessThan(oneYear.from.getTime());
    expect(all.from.getFullYear()).toBe(2000);
  });
});
