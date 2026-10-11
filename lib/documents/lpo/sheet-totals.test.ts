import { describe, expect, it } from "vitest";

import { computeLpoSheetTotals } from "./sheet-totals";
import type { LineItemRow } from "@/types";

function lineItem(
  id: string,
  description: string,
  quantity: number,
  unitPrice: number,
  taxRate: number,
  sortOrder: number,
): LineItemRow {
  return {
    id,
    document_id: "lpo-1",
    description,
    notes: null,
    quantity,
    unit_price: unitPrice,
    tax_rate: taxRate,
    sort_order: sortOrder,
    hsn_sac_code: null,
    created_at: "2026-05-06T00:00:00Z",
    updated_at: "2026-05-06T00:00:00Z",
  };
}

describe("computeLpoSheetTotals", () => {
  it("computes VAT and the adjustment needed to reach the PO cap", () => {
    const totals = computeLpoSheetTotals({
      lineItems: [
        lineItem("1", "Design system & component library", 1, 3200, 5, 1),
        lineItem("2", "Landing page — responsive build", 1, 2800, 5, 2),
        lineItem("3", "Engineering pairing — capped at 12 sessions", 12, 220, 5, 3),
        lineItem("4", "Post-launch tweaks, QA & contingency", 1, 880, 5, 4),
      ],
      discountValue: 0,
      discountType: "percent",
      lpoAmount: 10000,
    });

    expect(totals).toEqual({
      subtotal: 9520,
      discount: 0,
      discountLabel: null,
      taxableSubtotal: 9520,
      tax: 476,
      taxLabel: "VAT 5%",
      totalBeforeCap: 9996,
      capAdjustment: 4,
      authorisedTotal: 10000,
    });
  });

  it("uses the computed total when no explicit LPO cap is set", () => {
    const totals = computeLpoSheetTotals({
      lineItems: [
        lineItem("1", "Strategy sprint", 2, 1000, 0, 1),
        lineItem("2", "Implementation", 1, 3000, 0, 2),
      ],
      discountValue: 500,
      discountType: "flat",
      lpoAmount: null,
    });

    expect(totals).toEqual({
      subtotal: 5000,
      discount: 500,
      discountLabel: "Discount",
      taxableSubtotal: 4500,
      tax: 0,
      taxLabel: null,
      totalBeforeCap: 4500,
      capAdjustment: 0,
      authorisedTotal: 4500,
    });
  });
});

describe("computeLpoSheetTotals — document VAT", () => {
  const item = {
    id: "1", document_id: "d", description: "Build", notes: null, quantity: 1, unit_price: 10000,
    tax_rate: 0, sort_order: 0, hsn_sac_code: null, created_at: "", updated_at: "",
  };

  it("uses the document tax mode when set", () => {
    const t = computeLpoSheetTotals({ lineItems: [item], taxMode: "vat", taxRate: 5 });
    expect(t.tax).toBe(500);
    expect(t.taxLabel).toBe("VAT 5%");
    expect(t.authorisedTotal).toBe(10500);
  });

  it("falls back to the highest line rate when mode is none", () => {
    const t = computeLpoSheetTotals({ lineItems: [{ ...item, tax_rate: 5 }], taxMode: "none", taxRate: 0 });
    expect(t.tax).toBe(500);
  });
});
