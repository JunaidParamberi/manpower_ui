import { describe, expect, it } from "vitest";
import { bandLabel, severityTone, signalKindLabel } from "./health-display";

describe("signalKindLabel", () => {
  it("maps every signal kind to a non-empty label", () => {
    const kinds = [
      "overdue_invoices",
      "slow_payer",
      "gone_quiet",
      "revenue_decline",
      "stalled_pipeline",
      "no_active_work",
    ] as const;
    for (const kind of kinds) {
      expect(signalKindLabel(kind).length).toBeGreaterThan(0);
    }
  });
});

describe("severityTone", () => {
  it("maps critical to destructive and info to outline", () => {
    expect(severityTone("critical")).toBe("destructive");
    expect(severityTone("info")).toBe("outline");
  });
});

describe("bandLabel", () => {
  it("matches lib/clients/display.ts healthPresentation labels", () => {
    expect(bandLabel("excellent")).toBe("Excellent health");
    expect(bandLabel("healthy")).toBe("Healthy");
    expect(bandLabel("needs_attention")).toBe("Needs attention");
    expect(bandLabel("at_risk")).toBe("At risk");
  });
});
