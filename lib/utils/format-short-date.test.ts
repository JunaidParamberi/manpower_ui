import { describe, expect, it } from "vitest";

import { formatShortDate } from "./format";

describe("formatShortDate", () => {
  it("formats an ISO date as 'Mon d' in UTC", () => {
    expect(formatShortDate("2026-10-13")).toBe("Oct 13");
    expect(formatShortDate("2026-01-02T23:30:00Z")).toBe("Jan 2");
  });
});
