import { describe, expect, it } from "vitest";
import {
  variantForStep,
  companionHeadline,
  displayStudioName,
  displayInvoiceMeta,
} from "./companion-panel";

describe("variantForStep", () => {
  it("maps steps to variants", () => {
    expect(variantForStep(1)).toBe("profile");
    expect(variantForStep(2)).toBe("brand");
    expect(variantForStep(3)).toBe("client");
  });
});

describe("companionHeadline", () => {
  it("returns a non-empty line per variant", () => {
    for (const v of ["auth", "profile", "brand", "client"] as const) {
      expect(companionHeadline(v).length).toBeGreaterThan(0);
    }
  });
});

describe("displayStudioName", () => {
  it("prefers company, then name, then fallback", () => {
    expect(displayStudioName({ companyName: "Atlas", fullName: "Jane" })).toBe("Atlas");
    expect(displayStudioName({ fullName: "Jane" })).toBe("Jane");
    expect(displayStudioName({})).toBe("Your studio");
    expect(displayStudioName({ companyName: "   " })).toBe("Your studio");
  });
});

describe("displayInvoiceMeta", () => {
  it("derives header, sub, and currency badge", () => {
    const meta = displayInvoiceMeta({ fullName: "Jane Doe", companyName: "Atlas", currency: "AED" });
    expect(meta.name).toBe("Atlas");
    expect(meta.sub).toBe("Jane Doe");
    expect(meta.currencyBadge).toBe("AED");
  });
  it("falls back when empty", () => {
    const meta = displayInvoiceMeta({});
    expect(meta.name).toBe("Your studio");
    expect(meta.sub).toBe("Add your name");
    expect(meta.currencyBadge).toBe("USD");
  });
});
