import { describe, it, expect } from "vitest";
import { importBillingSchema, previewBillingSchema } from "./import-billing";

const INVOICE_ID = "550e8400-e29b-41d4-a716-446655440001";
const PROJECT_ID = "550e8400-e29b-41d4-a716-446655440002";

const validImport = {
  invoice_id: INVOICE_ID,
  project_id: PROJECT_ID,
  date_from: "2026-06-01",
  date_to: "2026-06-30",
  hourly_rate: 150,
};

describe("importBillingSchema", () => {
  it("accepts valid input", () => {
    expect(importBillingSchema.safeParse(validImport).success).toBe(true);
  });

  it("rejects missing invoice_id", () => {
    const rest = { ...validImport };
    delete (rest as { invoice_id?: string }).invoice_id;
    expect(importBillingSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects invalid invoice_id (not uuid)", () => {
    expect(
      importBillingSchema.safeParse({ ...validImport, invoice_id: "not-a-uuid" })
        .success,
    ).toBe(false);
  });

  it("rejects invalid date_from format", () => {
    expect(
      importBillingSchema.safeParse({ ...validImport, date_from: "01-06-2026" })
        .success,
    ).toBe(false);
  });

  it("rejects invalid date_to format", () => {
    expect(
      importBillingSchema.safeParse({ ...validImport, date_to: "30/06/2026" })
        .success,
    ).toBe(false);
  });

  it("rejects negative hourly_rate", () => {
    expect(
      importBillingSchema.safeParse({ ...validImport, hourly_rate: -5 }).success,
    ).toBe(false);
  });

  it("coerces string hourly_rate to number", () => {
    const result = importBillingSchema.safeParse({
      ...validImport,
      hourly_rate: "200",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.hourly_rate).toBe(200);
  });
});

describe("previewBillingSchema", () => {
  it("accepts valid input", () => {
    const input = {
      project_id: PROJECT_ID,
      date_from: "2026-06-01",
      date_to: "2026-06-30",
    };
    expect(previewBillingSchema.safeParse(input).success).toBe(true);
  });

  it("rejects missing project_id", () => {
    expect(
      previewBillingSchema.safeParse({
        date_from: "2026-06-01",
        date_to: "2026-06-30",
      }).success,
    ).toBe(false);
  });
});
