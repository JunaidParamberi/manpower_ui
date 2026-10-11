import { describe, expect, it } from "vitest";

import { aggregateFinancialSummary } from "@/lib/finance/summary-calc";

describe("aggregateFinancialSummary", () => {
  const now = new Date("2026-06-10T00:00:00.000Z");

  it("sums payments as revenue per currency", () => {
    const result = aggregateFinancialSummary({
      baseCurrency: "AED",
      payments: [
        { amount: 500, currency: "AED" },
        { amount: 300, currency: "AED" },
        { amount: 100, currency: "USD" },
      ],
      openInvoices: [],
      now,
    });
    expect(result.totalRevenue).toBe(800);
    expect(result.byCurrency).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ currency: "AED", totalRevenue: 800 }),
        expect.objectContaining({ currency: "USD", totalRevenue: 100 }),
      ]),
    );
  });

  it("counts partially paid invoices' open balance as outstanding", () => {
    const result = aggregateFinancialSummary({
      baseCurrency: "AED",
      payments: [],
      openInvoices: [
        { total: 1000, paid: 400, writtenOff: 0, currency: "AED", dueDate: null },
      ],
      now,
    });
    expect(result.outstanding).toBe(600);
    expect(result.outstandingCount).toBe(1);
  });

  it("flags overdue by due date using the open balance", () => {
    const result = aggregateFinancialSummary({
      baseCurrency: "AED",
      payments: [],
      openInvoices: [
        { total: 1000, paid: 0, writtenOff: 0, currency: "AED", dueDate: "2026-06-01" },
        { total: 500, paid: 0, writtenOff: 0, currency: "AED", dueDate: "2026-07-01" },
      ],
      now,
    });
    expect(result.overdue).toBe(1000);
    expect(result.overdueCount).toBe(1);
  });

  it("ignores fully covered invoices", () => {
    const result = aggregateFinancialSummary({
      baseCurrency: "AED",
      payments: [],
      openInvoices: [
        { total: 1000, paid: 600, writtenOff: 400, currency: "AED", dueDate: null },
      ],
      now,
    });
    expect(result.outstanding).toBe(0);
    expect(result.outstandingCount).toBe(0);
  });
});

describe("aggregateFinancialSummary — primary currency selection", () => {
  const now = new Date("2026-06-10T00:00:00.000Z");

  it("falls back to the busiest currency when the base currency holds nothing", () => {
    const result = aggregateFinancialSummary({
      baseCurrency: "INR",
      payments: [{ amount: 6240, currency: "AED" }],
      openInvoices: [],
      now,
    });
    expect(result.primaryCurrency).toBe("AED");
    expect(result.totalRevenue).toBe(6240);
  });

  it("keeps the base currency as primary when it holds money", () => {
    const result = aggregateFinancialSummary({
      baseCurrency: "AED",
      payments: [
        { amount: 100, currency: "AED" },
        { amount: 9000, currency: "USD" },
      ],
      openInvoices: [],
      now,
    });
    expect(result.primaryCurrency).toBe("AED");
    expect(result.totalRevenue).toBe(100);
  });

  it("ranks fallback currencies by revenue plus outstanding", () => {
    const result = aggregateFinancialSummary({
      baseCurrency: "INR",
      payments: [{ amount: 100, currency: "USD" }],
      openInvoices: [
        { total: 5000, paid: 0, writtenOff: 0, currency: "AED", dueDate: null },
      ],
      now,
    });
    expect(result.primaryCurrency).toBe("AED");
    expect(result.outstanding).toBe(5000);
  });

  it("keeps the base currency as primary when there is no money at all", () => {
    const result = aggregateFinancialSummary({
      baseCurrency: "INR",
      payments: [],
      openInvoices: [],
      now,
    });
    expect(result.primaryCurrency).toBe("INR");
    expect(result.totalRevenue).toBe(0);
    expect(result.byCurrency).toEqual([]);
  });

  it("exposes non-primary currencies so nothing is silently dropped", () => {
    const result = aggregateFinancialSummary({
      baseCurrency: "AED",
      payments: [
        { amount: 500, currency: "AED" },
        { amount: 800, currency: "USD" },
      ],
      openInvoices: [],
      now,
    });
    expect(result.primaryCurrency).toBe("AED");
    expect(result.byCurrency.map((b) => b.currency)).toEqual(["AED", "USD"]);
  });
});
