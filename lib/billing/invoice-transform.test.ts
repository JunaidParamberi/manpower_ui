import { describe, it, expect } from "vitest";
import { transformLsInvoice } from "./invoice-transform";

const mockRow = {
  id: "42",
  attributes: {
    status: "paid" as const,
    total_formatted: "AED 179.00",
    total: 17900,
    currency: "AED",
    urls: { invoice_url: "https://app.lemonsqueezy.com/my-orders/abc/subscription-invoice/42" },
    created_at: "2026-05-01T10:00:00.000000Z",
    test_mode: false,
  },
};

describe("transformLsInvoice", () => {
  it("maps all fields correctly", () => {
    const result = transformLsInvoice(mockRow);
    expect(result).toEqual({
      id: "42",
      status: "paid",
      totalFormatted: "AED 179.00",
      totalCents: 17900,
      currency: "AED",
      invoiceUrl: "https://app.lemonsqueezy.com/my-orders/abc/subscription-invoice/42",
      createdAt: "2026-05-01T10:00:00.000000Z",
      isTestMode: false,
    });
  });

  it("handles missing invoice_url as null", () => {
    const row = { ...mockRow, attributes: { ...mockRow.attributes, urls: { invoice_url: "" } } };
    expect(transformLsInvoice(row).invoiceUrl).toBeNull();
  });

  it("handles refunded status", () => {
    const row = { ...mockRow, attributes: { ...mockRow.attributes, status: "refunded" as const } };
    expect(transformLsInvoice(row).status).toBe("refunded");
  });
});
