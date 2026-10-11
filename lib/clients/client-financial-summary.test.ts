import { describe, expect, it } from "vitest";

import { computeClientFinancialSummary } from "./client-financial-summary";
import type { DocumentListRow } from "@/types";

function invoice(overrides: Partial<DocumentListRow>): DocumentListRow {
  return {
    id: "doc-1",
    user_id: "user-1",
    client_id: "client-1",
    project_id: null,
    type: "invoice",
    title_is_auto: false,
    status: "sent",
    title: "Invoice",
    content_json: { type: "doc" },
    pdf_url: null,
    sent_at: null,
    viewed_at: null,
    signed_at: null,
    invoice_number: null,
    due_date: null,
    payment_terms: null,
    notes_footer: null,
    paid_at: null,
    pay_token: null,
    discount_value: 0,
    discount_type: "flat",
    quote_number: null,
    proposal_number: null,
    valid_until: null,
    approval_token: null,
    approved_at: null,
    declined_at: null,
    approval_message: null,
    approval_recipient_email: null,
    approval_otp: null,
    approval_otp_expires_at: null,
    approved_by_email: null,
    receipt_number: null,
    source_document_id: null,
    payment_id: null,
    lpo_number: null,
    lpo_validity_date: null,
    lpo_amount: null,
    lpo_pdf_url: null,
    lpo_reference_number: null,
    proposal_content: null,
    currency: "USD",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    issued_at: null,
    deleted_at: null,
    internal_notes: null,
    void_reason: null,
    tax_mode: "none" as const,
    tax_rate: 0,
    fx_rate: null,
    tds_enabled: false,
    tds_rate: 0,
    tds_certificate_url: null,
    recurring_invoice_id: null,
    client: { id: "client-1", name: "Client", currency: "USD" },
    project: null,
    total_amount: 100,
    ...overrides,
  };
}

describe("computeClientFinancialSummary", () => {
  it("summarizes billed, paid, outstanding, and overdue invoice totals", () => {
    const summary = computeClientFinancialSummary({
      documents: [
        invoice({ id: "paid", status: "paid", total_amount: 200 }),
        invoice({
          id: "overdue",
          status: "sent",
          total_amount: 300,
          due_date: "2026-01-05",
        }),
        invoice({ id: "quote", type: "quote", total_amount: 999 }),
      ],
      fallbackCurrency: "USD",
      today: new Date("2026-01-10T00:00:00.000Z"),
    });

    expect(summary).toEqual({
      currency: "USD",
      billedTotal: 500,
      paidTotal: 200,
      outstandingTotal: 300,
      overdueTotal: 300,
      overdueCount: 1,
      oldestOverdueDays: 5,
      invoiceCount: 2,
      otherCurrencyCount: 0,
      avgDaysToPay: null,
      previousAvgDaysToPay: null,
    });
  });
});

describe("days to pay", () => {
  const today = new Date("2026-10-09T10:00:00.000Z");
  const paid = (sent: string, paidAt: string) =>
    invoice({ id: `${sent}-${paidAt}`, status: "paid", sent_at: sent, paid_at: paidAt, total_amount: 100 });

  it("is null with no paid invoices", () => {
    const s = computeClientFinancialSummary({ documents: [invoice({ total_amount: 100 })], fallbackCurrency: "USD", today });
    expect(s.avgDaysToPay).toBeNull();
    expect(s.previousAvgDaysToPay).toBeNull();
  });

  it("averages the last 3 paid invoices and has no previous with fewer than 4", () => {
    const s = computeClientFinancialSummary({
      documents: [paid("2026-09-01", "2026-09-11"), paid("2026-08-01", "2026-08-21"), paid("2026-07-01", "2026-07-07")],
      fallbackCurrency: "USD",
      today,
    });
    expect(s.avgDaysToPay).toBe(12);
    expect(s.previousAvgDaysToPay).toBeNull();
  });

  it("compares the last 3 with the 3 before, by paid date", () => {
    const s = computeClientFinancialSummary({
      documents: [
        paid("2026-01-01", "2026-01-11"),
        paid("2026-02-01", "2026-02-11"),
        paid("2026-03-01", "2026-03-11"),
        paid("2026-07-01", "2026-07-21"),
        paid("2026-08-01", "2026-08-21"),
        paid("2026-09-01", "2026-09-16"),
      ],
      fallbackCurrency: "USD",
      today,
    });
    expect(s.avgDaysToPay).toBe(18);
    expect(s.previousAvgDaysToPay).toBe(10);
  });

  it("skips paid invoices missing a sent or paid date", () => {
    const s = computeClientFinancialSummary({
      documents: [invoice({ status: "paid", sent_at: null, paid_at: "2026-09-01", total_amount: 100 })],
      fallbackCurrency: "USD",
      today,
    });
    expect(s.avgDaysToPay).toBeNull();
  });

  it("counts overdue invoices and the oldest overdue days", () => {
    const s = computeClientFinancialSummary({
      documents: [
        invoice({ id: "a", due_date: "2026-09-30", total_amount: 100 }),
        invoice({ id: "b", due_date: "2026-09-20", total_amount: 100 }),
        invoice({ id: "c", due_date: "2026-10-30", total_amount: 100 }),
      ],
      fallbackCurrency: "USD",
      today,
    });
    expect(s.overdueCount).toBe(2);
    expect(s.oldestOverdueDays).toBe(19);
  });
});

describe("review fixes", () => {
  const today = new Date("2026-10-09T10:00:00.000Z");

  it("counts only the unpaid balance of a partially paid overdue invoice", () => {
    const s = computeClientFinancialSummary({
      documents: [invoice({ status: "partially_paid", total_amount: 1000, amount_paid: 400, due_date: "2026-10-02" })],
      fallbackCurrency: "USD",
      today,
    });
    expect(s.outstandingTotal).toBe(600);
    expect(s.overdueTotal).toBe(600);
    expect(s.paidTotal).toBe(400);
    expect(s.overdueCount).toBe(1);
  });

  it("does not count approved invoices as owed (same rule as the list row)", () => {
    const s = computeClientFinancialSummary({
      documents: [invoice({ status: "approved", total_amount: 500, due_date: "2026-09-01" })],
      fallbackCurrency: "USD",
      today,
    });
    expect(s.outstandingTotal).toBe(0);
  });

  it("totals only invoices in the client's currency and counts the others", () => {
    const s = computeClientFinancialSummary({
      documents: [
        invoice({ id: "gbp", currency: "GBP", total_amount: 100 }),
        invoice({ id: "usd", currency: "USD", total_amount: 900 }),
      ],
      fallbackCurrency: "GBP",
      today,
    });
    expect(s.currency).toBe("GBP");
    expect(s.billedTotal).toBe(100);
    expect(s.otherCurrencyCount).toBe(1);
  });
});
