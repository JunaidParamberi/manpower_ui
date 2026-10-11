import { describe, expect, it } from "vitest";

import {
  formatHhmmAs12hClock,
  hhmmFrom12Parts,
  parseHhmmTo12Parts,
} from "@/lib/utils/time-hhmm-12h";

describe("parseHhmmTo12Parts / formatHhmmAs12hClock / hhmmFrom12Parts", () => {
  it("formats midnight and noon", () => {
    expect(formatHhmmAs12hClock("00:00")).toBe("12:00 AM");
    expect(formatHhmmAs12hClock("12:00")).toBe("12:00 PM");
  });

  it("formats morning and afternoon times", () => {
    expect(formatHhmmAs12hClock("09:07")).toBe("9:07 AM");
    expect(formatHhmmAs12hClock("21:07")).toBe("9:07 PM");
  });

  it("returns empty for invalid or empty input", () => {
    expect(formatHhmmAs12hClock("")).toBe("");
    expect(parseHhmmTo12Parts("")).toBeNull();
    expect(parseHhmmTo12Parts("bad")).toBeNull();
  });

  it("round-trips 12h parts to 24h HH:mm", () => {
    const p = parseHhmmTo12Parts("14:30");
    expect(p).not.toBeNull();
    if (!p) {
      return;
    }
    expect(hhmmFrom12Parts(p)).toBe("14:30");
    expect(
      hhmmFrom12Parts({
        hour12: 9,
        minute: "07",
        period: "am",
      }),
    ).toBe("09:07");
    expect(
      hhmmFrom12Parts({
        hour12: 12,
        minute: "00",
        period: "am",
      }),
    ).toBe("00:00");
    expect(
      hhmmFrom12Parts({
        hour12: 12,
        minute: "00",
        period: "pm",
      }),
    ).toBe("12:00");
  });
});
