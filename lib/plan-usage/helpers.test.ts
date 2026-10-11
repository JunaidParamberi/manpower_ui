import { describe, it, expect } from "vitest";
import {
  getPlanLimit,
  getUsageRatio,
  getUsageLevel,
  shouldShowBanner,
  startOfCurrentMonth,
} from "./helpers";

describe("getPlanLimit", () => {
  it("returns 3 clients for free", () => {
    expect(getPlanLimit("free", "clients")).toBe(3);
  });
  it("returns 5 docs for free", () => {
    expect(getPlanLimit("free", "docsPerMonth")).toBe(5);
  });
  it("returns 15 clients for starter", () => {
    expect(getPlanLimit("starter", "clients")).toBe(15);
  });
  it("returns Infinity for unlimited", () => {
    expect(getPlanLimit("starter", "docsPerMonth")).toBe(Infinity);
    expect(getPlanLimit("pro", "clients")).toBe(Infinity);
    expect(getPlanLimit("agency", "clients")).toBe(Infinity);
  });
});

describe("getUsageRatio", () => {
  it("returns ratio when limit is finite", () => {
    expect(getUsageRatio(2, 3)).toBeCloseTo(0.667, 2);
  });
  it("returns 0 when limit is Infinity", () => {
    expect(getUsageRatio(999, Infinity)).toBe(0);
  });
});

describe("getUsageLevel", () => {
  it("returns ok for ratio <= 0.6", () => {
    expect(getUsageLevel(0)).toBe("ok");
    expect(getUsageLevel(0.6)).toBe("ok");
  });
  it("returns warn for ratio 0.61–0.8", () => {
    expect(getUsageLevel(0.61)).toBe("warn");
    expect(getUsageLevel(0.8)).toBe("warn");
  });
  it("returns danger for ratio > 0.8", () => {
    expect(getUsageLevel(0.81)).toBe("danger");
    expect(getUsageLevel(1)).toBe("danger");
  });
});

describe("shouldShowBanner", () => {
  it("returns true when clients ratio >= 0.8", () => {
    expect(
      shouldShowBanner({ planTier: "free", clientCount: 3, docCountThisMonth: 1 })
    ).toBe(true);
  });
  it("returns true when docs ratio >= 0.8", () => {
    expect(
      shouldShowBanner({ planTier: "free", clientCount: 1, docCountThisMonth: 4 })
    ).toBe(true);
  });
  it("returns false when both under 80%", () => {
    expect(
      shouldShowBanner({ planTier: "free", clientCount: 1, docCountThisMonth: 2 })
    ).toBe(false);
  });
  it("returns false for pro regardless of counts", () => {
    expect(
      shouldShowBanner({ planTier: "pro", clientCount: 999, docCountThisMonth: 999 })
    ).toBe(false);
  });
  it("returns false for agency", () => {
    expect(
      shouldShowBanner({ planTier: "agency", clientCount: 999, docCountThisMonth: 999 })
    ).toBe(false);
  });
});

describe("startOfCurrentMonth", () => {
  it("returns ISO string for first of current month", () => {
    const result = startOfCurrentMonth();
    const now = new Date();
    expect(result).toMatch(/^\d{4}-\d{2}-01T/);
    expect(result.startsWith(`${now.getFullYear()}-`)).toBe(true);
  });
});
