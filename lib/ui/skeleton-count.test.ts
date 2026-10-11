import { describe, expect, it } from "vitest";

import {
  FINANCE_INVOICE_LIMIT,
  paginatedListSkeletonCount,
  resolveSkeletonCount,
  TABLE_PAGE_SIZE,
} from "./skeleton-count";

describe("resolveSkeletonCount", () => {
  it("returns 0 when stored is null or undefined", () => {
    expect(resolveSkeletonCount(null)).toBe(0);
    expect(resolveSkeletonCount(undefined)).toBe(0);
  });

  it("returns floored non-negative integer", () => {
    expect(resolveSkeletonCount(3.7)).toBe(3);
    expect(resolveSkeletonCount(0)).toBe(0);
  });

  it("returns 0 for invalid values", () => {
    expect(resolveSkeletonCount(-1)).toBe(0);
    expect(resolveSkeletonCount(Number.NaN)).toBe(0);
    expect(resolveSkeletonCount(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("clamps to cap when provided", () => {
    expect(resolveSkeletonCount(15, TABLE_PAGE_SIZE)).toBe(10);
    expect(resolveSkeletonCount(3, TABLE_PAGE_SIZE)).toBe(3);
    expect(resolveSkeletonCount(25, FINANCE_INVOICE_LIMIT)).toBe(20);
  });
});

describe("paginatedListSkeletonCount", () => {
  it("caps at TABLE_PAGE_SIZE", () => {
    expect(paginatedListSkeletonCount(25)).toBe(TABLE_PAGE_SIZE);
    expect(paginatedListSkeletonCount(2)).toBe(2);
    expect(paginatedListSkeletonCount(0)).toBe(0);
  });
});
