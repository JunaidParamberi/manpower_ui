import { describe, expect, it } from "vitest";
import { parseContentCampaign } from "./content-campaign";

describe("parseContentCampaign", () => {
  const base = {
    name: "Spring push",
    goal: "Promote web design service",
    startDate: "2026-08-01",
    endDate: "2026-08-14",
    platforms: ["Instagram", "LinkedIn"],
    cadencePerWeek: 3,
  };

  it("accepts a valid campaign", () => {
    expect(parseContentCampaign(base).ok).toBe(true);
  });

  it("rejects end before start", () => {
    expect(parseContentCampaign({ ...base, endDate: "2026-07-01" }).ok).toBe(false);
  });

  it("rejects empty platforms", () => {
    expect(parseContentCampaign({ ...base, platforms: [] }).ok).toBe(false);
  });

  it("rejects cadence out of 1..7", () => {
    expect(parseContentCampaign({ ...base, cadencePerWeek: 9 }).ok).toBe(false);
  });
});
