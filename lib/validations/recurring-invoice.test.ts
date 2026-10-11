import { describe, it, expect } from "vitest";
import { recurringInvoiceSchema } from "./recurring-invoice";

const validLine = {
  description: "Monthly retainer",
  notes: null,
  quantity: 1,
  unit_price: 2000,
  tax_rate: 0,
  hsn_sac_code: null,
};

const validPayload = {
  client_id: "550e8400-e29b-41d4-a716-446655440001",
  project_id: null,
  title: "Acme monthly retainer",
  interval: "monthly" as const,
  interval_count: 1,
  start_date: "2026-07-01",
  end_date: null,
  occurrences_limit: null,
  auto_send: false,
  net_days: 7,
  currency: "USD",
  tax_mode: "none" as const,
  tax_rate: 0,
  discount_type: "percent" as const,
  discount_value: 0,
  notes_footer: null,
  payment_terms: null,
  line_items: [validLine],
};

describe("recurringInvoiceSchema", () => {
  it("accepts valid input", () => {
    expect(recurringInvoiceSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects empty line items", () => {
    expect(
      recurringInvoiceSchema.safeParse({ ...validPayload, line_items: [] })
        .success,
    ).toBe(false);
  });

  it("rejects interval_count of 0", () => {
    expect(
      recurringInvoiceSchema.safeParse({ ...validPayload, interval_count: 0 })
        .success,
    ).toBe(false);
  });

  it("rejects interval_count of 25", () => {
    expect(
      recurringInvoiceSchema.safeParse({ ...validPayload, interval_count: 25 })
        .success,
    ).toBe(false);
  });

  it("coerces string interval_count", () => {
    const result = recurringInvoiceSchema.safeParse({
      ...validPayload,
      interval_count: "2",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.interval_count).toBe(2);
  });

  it("coerces string net_days and tax_rate", () => {
    const result = recurringInvoiceSchema.safeParse({
      ...validPayload,
      net_days: "14",
      tax_rate: "5",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.net_days).toBe(14);
      expect(result.data.tax_rate).toBe(5);
    }
  });

  it("rejects bad interval", () => {
    expect(
      recurringInvoiceSchema.safeParse({
        ...validPayload,
        interval: "hourly",
      }).success,
    ).toBe(false);
  });

  it("accepts daily and yearly intervals", () => {
    expect(
      recurringInvoiceSchema.safeParse({ ...validPayload, interval: "daily" })
        .success,
    ).toBe(true);
    expect(
      recurringInvoiceSchema.safeParse({ ...validPayload, interval: "yearly" })
        .success,
    ).toBe(true);
  });
});
