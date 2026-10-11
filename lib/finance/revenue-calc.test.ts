import { describe, expect, it } from "vitest";
import {
  calcLineItemsTotal,
  applyDiscount,
  calcAvgPayDays,
  calcRevenueChangePct,
  buildMonthlyRevenueBuckets,
} from "./revenue-calc";

describe("calcLineItemsTotal", () => {
  it("sums quantity * unit_price across all line items", () => {
    const items = [
      { quantity: "2", unit_price: "100.00", tax_rate: "0" },
      { quantity: "1", unit_price: "50.00", tax_rate: "0" },
    ];
    expect(calcLineItemsTotal(items)).toBe(250);
  });

  it("returns 0 for empty line items", () => {
    expect(calcLineItemsTotal([])).toBe(0);
  });
});

describe("applyDiscount", () => {
  it("applies percent discount", () => {
    expect(applyDiscount(200, "percent", 10)).toBe(180);
  });

  it("applies flat discount, clamped to subtotal", () => {
    expect(applyDiscount(200, "flat", 50)).toBe(150);
    expect(applyDiscount(200, "flat", 300)).toBe(0);
  });

  it("returns subtotal unchanged when discount_value is 0", () => {
    expect(applyDiscount(200, "percent", 0)).toBe(200);
    expect(applyDiscount(200, "flat", 0)).toBe(200);
  });
});

describe("calcAvgPayDays", () => {
  it("returns average days between sent_at and paid_at", () => {
    const invoices = [
      { sent_at: "2026-01-01T00:00:00Z", paid_at: "2026-01-15T00:00:00Z" },
      { sent_at: "2026-02-01T00:00:00Z", paid_at: "2026-02-11T00:00:00Z" },
    ];
    expect(calcAvgPayDays(invoices)).toBe(12);
  });

  it("returns null when no paid invoices", () => {
    expect(calcAvgPayDays([])).toBeNull();
  });
});

describe("calcRevenueChangePct", () => {
  it("computes percentage change", () => {
    expect(calcRevenueChangePct(1200, 1000)).toBe(20);
  });

  it("returns null when previous is 0", () => {
    expect(calcRevenueChangePct(500, 0)).toBeNull();
  });
});

describe("buildMonthlyRevenueBuckets", () => {
  it("sums payments into their calendar month", () => {
    const buckets = buildMonthlyRevenueBuckets(
      [
        { amount: 500, paid_at: "2026-08-02T10:00:00.000Z" },
        { amount: 250, paid_at: "2026-08-28T10:00:00.000Z" },
      ],
      "2026-08",
    );
    expect(buckets).toEqual([{ monthKey: "2026-08", revenue: 750 }]);
  });

  it("fills months with no income as zero instead of dropping them", () => {
    const buckets = buildMonthlyRevenueBuckets(
      [
        { amount: 1000, paid_at: "2026-06-10T10:00:00.000Z" },
        { amount: 400, paid_at: "2026-09-10T10:00:00.000Z" },
      ],
      "2026-09",
    );
    expect(buckets.map((b) => b.monthKey)).toEqual([
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
    ]);
    expect(buckets.map((b) => b.revenue)).toEqual([1000, 0, 0, 400]);
  });

  it("extends the series to the current month even with no recent income", () => {
    const buckets = buildMonthlyRevenueBuckets(
      [{ amount: 100, paid_at: "2025-11-05T10:00:00.000Z" }],
      "2026-01",
    );
    expect(buckets.map((b) => b.monthKey)).toEqual(["2025-11", "2025-12", "2026-01"]);
  });

  it("rolls over the year boundary", () => {
    const buckets = buildMonthlyRevenueBuckets(
      [{ amount: 100, paid_at: "2026-12-05T10:00:00.000Z" }],
      "2027-02",
    );
    expect(buckets.map((b) => b.monthKey)).toEqual(["2026-12", "2027-01", "2027-02"]);
  });

  it("returns nothing when there are no payments", () => {
    expect(buildMonthlyRevenueBuckets([], "2026-09")).toEqual([]);
  });
});
