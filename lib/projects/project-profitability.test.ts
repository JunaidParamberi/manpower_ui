import { describe, expect, it } from "vitest";

import { buildProjectProfitability, mapProfitabilityInvoiceRows } from "./project-profitability";

const noTime: never[] = [];
const noExpenses: never[] = [];

describe("buildProjectProfitability", () => {
  it("returns zeros when all inputs are empty", () => {
    const result = buildProjectProfitability({
      invoices: [],
      expenses: noExpenses,
      timeEntries: noTime,
      hourlyRate: null,
    });
    expect(result.invoicedTotal).toBe(0);
    expect(result.collectedTotal).toBe(0);
    expect(result.outstandingTotal).toBe(0);
    expect(result.expenseCost).toBe(0);
    expect(result.margin).toBe(0);
    expect(result.unbilledTimeValue).toBe(0);
    expect(result.effectiveHourlyRate).toBeNull();
  });

  it("sums invoiced total from total_amount", () => {
    const result = buildProjectProfitability({
      invoices: [
        { total_amount: 1000, payments: [] },
        { total_amount: 2500, payments: [] },
      ],
      expenses: noExpenses,
      timeEntries: noTime,
      hourlyRate: null,
    });
    expect(result.invoicedTotal).toBe(3500);
    expect(result.collectedTotal).toBe(0);
    expect(result.outstandingTotal).toBe(3500);
  });

  it("sums collected from nested payments", () => {
    const result = buildProjectProfitability({
      invoices: [
        { total_amount: 1000, payments: [{ amount: 500 }, { amount: 200 }] },
        { total_amount: 500, payments: [{ amount: 500 }] },
      ],
      expenses: noExpenses,
      timeEntries: noTime,
      hourlyRate: null,
    });
    expect(result.collectedTotal).toBe(1200);
    expect(result.outstandingTotal).toBe(300);
  });

  it("computes margin as collected minus expenses", () => {
    const result = buildProjectProfitability({
      invoices: [{ total_amount: 5000, payments: [{ amount: 4000 }] }],
      expenses: [{ amount: 800 }, { amount: 200 }],
      timeEntries: noTime,
      hourlyRate: null,
    });
    expect(result.expenseCost).toBe(1000);
    expect(result.margin).toBe(3000); // 4000 - 1000
  });

  it("margin is negative when expenses exceed collected", () => {
    const result = buildProjectProfitability({
      invoices: [{ total_amount: 1000, payments: [{ amount: 500 }] }],
      expenses: [{ amount: 700 }],
      timeEntries: noTime,
      hourlyRate: null,
    });
    expect(result.margin).toBe(-200);
  });

  it("outstanding is never negative", () => {
    // over-paid scenario
    const result = buildProjectProfitability({
      invoices: [{ total_amount: 100, payments: [{ amount: 200 }] }],
      expenses: noExpenses,
      timeEntries: noTime,
      hourlyRate: null,
    });
    expect(result.outstandingTotal).toBe(0);
    expect(result.collectedTotal).toBe(200);
  });

  it("computes unbilled time value from hourly rate", () => {
    const result = buildProjectProfitability({
      invoices: [],
      expenses: noExpenses,
      timeEntries: [
        { duration_seconds: 7200, billed: false }, // 2h unbilled
        { duration_seconds: 3600, billed: true },  // 1h billed
      ],
      hourlyRate: 100,
    });
    expect(result.trackedMinutes).toBe(180);
    expect(result.billedMinutes).toBe(60);
    expect(result.unbilledMinutes).toBe(120);
    expect(result.unbilledTimeValue).toBe(200); // 2h × $100
  });

  it("unbilledTimeValue is 0 when no hourly rate", () => {
    const result = buildProjectProfitability({
      invoices: [],
      expenses: noExpenses,
      timeEntries: [{ duration_seconds: 3600, billed: false }],
      hourlyRate: null,
    });
    expect(result.unbilledTimeValue).toBe(0);
  });

  it("computes effective hourly rate as collected / tracked hours", () => {
    const result = buildProjectProfitability({
      invoices: [{ total_amount: 1200, payments: [{ amount: 1200 }] }],
      expenses: noExpenses,
      timeEntries: [
        { duration_seconds: 7200, billed: true }, // 2h
        { duration_seconds: 3600, billed: true }, // 1h
      ],
      hourlyRate: null,
    });
    // 1200 collected / 3h tracked = 400/h
    expect(result.effectiveHourlyRate).toBeCloseTo(400);
  });

  it("effectiveHourlyRate is null when no tracked hours", () => {
    const result = buildProjectProfitability({
      invoices: [{ total_amount: 1000, payments: [{ amount: 1000 }] }],
      expenses: noExpenses,
      timeEntries: noTime,
      hourlyRate: null,
    });
    expect(result.effectiveHourlyRate).toBeNull();
  });

  it("handles null total_amount gracefully", () => {
    const result = buildProjectProfitability({
      invoices: [{ total_amount: null, payments: [] }],
      expenses: noExpenses,
      timeEntries: noTime,
      hourlyRate: null,
    });
    expect(result.invoicedTotal).toBe(0);
  });
});

describe("mapProfitabilityInvoiceRows", () => {
  const row = {
    id: "inv-1",
    project_id: "p1",
    status: "partially_paid",
    due_date: "2026-10-27",
    discount_value: "0.00",
    discount_type: "percent",
    tax_mode: "vat",
    tax_rate: "5.00",
    line_items: [{ quantity: "1.00", unit_price: "10000.00", tax_rate: "0.00" }],
    payments: [{ amount: "4000.00" }],
    invoice_adjustments: [
      { amount: "500.00", type: "write_off" },
      { amount: "100.00", type: "credit" },
    ],
  };

  it("computes the invoice total from line items, discount and document VAT", () => {
    const { invoices } = mapProfitabilityInvoiceRows([row]);
    expect(invoices).toEqual([{ total_amount: 10500, payments: [{ amount: 4000 }] }]);
  });

  it("gives the digest the outstanding balance after payments and write-offs", () => {
    const { digestInvoices } = mapProfitabilityInvoiceRows([row]);
    expect(digestInvoices).toEqual([
      { id: "inv-1", projectId: "p1", status: "partially_paid", dueDate: "2026-10-27", total: 6000 },
    ]);
  });

  it("uses line-item tax when the document has no tax mode", () => {
    const { invoices } = mapProfitabilityInvoiceRows([
      { ...row, tax_mode: "none", tax_rate: 0, line_items: [{ quantity: 1, unit_price: 10000, tax_rate: 5 }] },
    ]);
    expect(invoices[0].total_amount).toBe(10500);
  });

  it("feeds buildProjectProfitability real totals", () => {
    const { invoices } = mapProfitabilityInvoiceRows([row]);
    const result = buildProjectProfitability({
      invoices,
      expenses: noExpenses,
      timeEntries: noTime,
      hourlyRate: null,
    });
    expect(result.invoicedTotal).toBe(10500);
    expect(result.collectedTotal).toBe(4000);
  });
});
