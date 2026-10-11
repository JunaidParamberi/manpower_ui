import { describe, expect, it } from "vitest";

import { buildAutoTitle, isLegacyPlaceholderTitle, resolveTitleSubmission } from "./auto-title";

describe("buildAutoTitle", () => {
  it("uses client and project", () => {
    expect(
      buildAutoTitle({ type: "quote", clientName: "Nova Retail FZ-LLC", projectTitle: "Website redesign", firstItem: "Design" }),
    ).toBe("Quote for Nova Retail FZ-LLC — Website redesign");
  });

  it("falls back to the first line item when there's no project", () => {
    expect(
      buildAutoTitle({ type: "invoice", clientName: "Nova Retail FZ-LLC", projectTitle: null, firstItem: "Website design and dev" }),
    ).toBe("Invoice for Nova Retail FZ-LLC — Website design and dev");
  });

  it("works without a client", () => {
    expect(buildAutoTitle({ type: "quote", clientName: null, projectTitle: null, firstItem: "Logo" })).toBe("Quote — Logo");
  });

  it("names a client-only document", () => {
    expect(buildAutoTitle({ type: "proposal", clientName: "KAT Group", projectTitle: null, firstItem: null })).toBe(
      "Proposal for KAT Group",
    );
  });

  it("uses a readable type label", () => {
    expect(buildAutoTitle({ type: "local_purchase_order", clientName: "Acme", projectTitle: null, firstItem: null })).toBe(
      "Purchase order for Acme",
    );
  });

  it("returns 'New <type>' when there's nothing to go on", () => {
    expect(buildAutoTitle({ type: "invoice", clientName: "  ", projectTitle: "", firstItem: null })).toBe("New invoice");
  });

  it("trims long parts and stays within the title limit", () => {
    const title = buildAutoTitle({ type: "quote", clientName: "C".repeat(200), projectTitle: "P".repeat(200), firstItem: null });
    expect(title.length).toBeLessThanOrEqual(120);
    expect(title.endsWith("…")).toBe(true);
  });
});

describe("isLegacyPlaceholderTitle", () => {
  it("recognises the old 'Untitled …' defaults", () => {
    expect(isLegacyPlaceholderTitle("Untitled quote")).toBe(true);
    expect(isLegacyPlaceholderTitle("untitled invoice")).toBe(true);
    expect(isLegacyPlaceholderTitle("Website_redesihn_3s")).toBe(false);
  });
});

describe("resolveTitleSubmission", () => {
  it("switches back to automatic when the title is cleared", () => {
    expect(resolveTitleSubmission({ submitted: "  ", current: "My quote", currentIsAuto: false })).toEqual({
      titleIsAuto: true,
    });
  });

  it("keeps the current mode when the title is unchanged", () => {
    expect(
      resolveTitleSubmission({ submitted: "Quote for Acme", current: "Quote for Acme", currentIsAuto: true }),
    ).toEqual({ titleIsAuto: true });
    expect(resolveTitleSubmission({ submitted: "Mine", current: "Mine", currentIsAuto: false })).toEqual({
      titleIsAuto: false,
      title: "Mine",
    });
  });

  it("makes the title custom when the user types a new one", () => {
    expect(
      resolveTitleSubmission({ submitted: " Brand refresh ", current: "Quote for Acme", currentIsAuto: true }),
    ).toEqual({ titleIsAuto: false, title: "Brand refresh" });
  });
});
