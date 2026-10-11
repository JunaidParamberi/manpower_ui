import { describe, expect, it } from "vitest";

import {
  combineScheduledAt,
  formatPostTime,
  moveScheduledAtToDay,
  splitScheduledAt,
} from "./schedule-utils";

describe("splitScheduledAt", () => {
  it("splits an ISO datetime into local date and time parts", () => {
    // Build from local parts so the assertion holds in any timezone.
    const local = new Date(2026, 5, 15, 14, 30);
    expect(splitScheduledAt(local.toISOString())).toEqual({
      date: "2026-06-15",
      time: "14:30",
    });
  });

  it("returns empty strings for null and unparseable input", () => {
    expect(splitScheduledAt(null)).toEqual({ date: "", time: "" });
    expect(splitScheduledAt("not-a-date")).toEqual({ date: "", time: "" });
  });

  it("accepts a Date, which is what a cached row may deserialize to", () => {
    expect(splitScheduledAt(new Date(2026, 0, 2, 9, 5))).toEqual({
      date: "2026-01-02",
      time: "09:05",
    });
  });
});

describe("combineScheduledAt", () => {
  it("round-trips with splitScheduledAt", () => {
    const iso = combineScheduledAt("2026-06-15", "14:30");
    expect(iso).not.toBeNull();
    expect(splitScheduledAt(iso)).toEqual({ date: "2026-06-15", time: "14:30" });
  });

  it("defaults a missing time to 09:00", () => {
    expect(splitScheduledAt(combineScheduledAt("2026-06-15", ""))).toEqual({
      date: "2026-06-15",
      time: "09:00",
    });
  });

  it("returns null without a date", () => {
    expect(combineScheduledAt("", "14:30")).toBeNull();
  });
});

describe("moveScheduledAtToDay", () => {
  it("keeps the existing time of day when moving days", () => {
    const from = new Date(2026, 5, 15, 16, 45).toISOString();
    const moved = moveScheduledAtToDay(from, "2026-06-18");
    expect(splitScheduledAt(moved)).toEqual({
      date: "2026-06-18",
      time: "16:45",
    });
  });

  it("uses 09:00 when the post had no time (was unscheduled)", () => {
    expect(splitScheduledAt(moveScheduledAtToDay(null, "2026-06-18"))).toEqual({
      date: "2026-06-18",
      time: "09:00",
    });
  });

  it("survives a month-boundary move", () => {
    const from = new Date(2026, 5, 30, 8, 0).toISOString();
    expect(splitScheduledAt(moveScheduledAtToDay(from, "2026-07-01"))).toEqual({
      date: "2026-07-01",
      time: "08:00",
    });
  });
});

describe("formatPostTime", () => {
  it("formats as zero-padded 24-hour local time", () => {
    expect(formatPostTime(new Date(2026, 5, 15, 9, 0).toISOString())).toBe("09:00");
    expect(formatPostTime(new Date(2026, 5, 15, 18, 5).toISOString())).toBe("18:05");
  });

  it("returns an empty string for null", () => {
    expect(formatPostTime(null)).toBe("");
  });
});
