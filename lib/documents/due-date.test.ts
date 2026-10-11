import { describe, expect, it } from "vitest";

import { computeDueDate } from "@/lib/documents/due-date";

describe("computeDueDate", () => {
  it("adds payment terms days to the issue date", () => {
    expect(computeDueDate("2026-06-10T08:00:00.000Z", 30)).toBe("2026-07-10");
  });

  it("returns null when terms are missing", () => {
    expect(computeDueDate("2026-06-10T08:00:00.000Z", null)).toBeNull();
    expect(computeDueDate("2026-06-10T08:00:00.000Z", undefined)).toBeNull();
  });

  it("handles zero-day terms (due on receipt)", () => {
    expect(computeDueDate("2026-06-10T08:00:00.000Z", 0)).toBe("2026-06-10");
  });
});
