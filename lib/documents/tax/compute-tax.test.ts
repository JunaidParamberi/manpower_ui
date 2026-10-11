import { describe, expect, it } from "vitest";
import { computeDocumentTax, taxModeSchema, TAX_MODE_LABELS } from "./compute-tax";

describe("computeDocumentTax", () => {
  it("returns no tax for none mode", () => {
    const r = computeDocumentTax({ taxableSubtotal: 1000, taxMode: "none", taxRate: 5 });
    expect(r).toEqual({ lines: [], totalTax: 0 });
  });

  it("returns no tax when rate is zero", () => {
    const r = computeDocumentTax({ taxableSubtotal: 1000, taxMode: "vat", taxRate: 0 });
    expect(r).toEqual({ lines: [], totalTax: 0 });
  });

  it("computes single VAT line", () => {
    const r = computeDocumentTax({ taxableSubtotal: 1000, taxMode: "vat", taxRate: 5 });
    expect(r.lines).toEqual([{ label: "VAT 5%", rate: 5, amount: 50 }]);
    expect(r.totalTax).toBe(50);
  });

  it("labels GST and IGST distinctly", () => {
    expect(computeDocumentTax({ taxableSubtotal: 1000, taxMode: "gst", taxRate: 18 }).lines[0].label).toBe("GST 18%");
    expect(computeDocumentTax({ taxableSubtotal: 1000, taxMode: "igst", taxRate: 18 }).lines[0].label).toBe("IGST 18%");
  });

  it("splits cgst_sgst into two half-rate lines", () => {
    const r = computeDocumentTax({ taxableSubtotal: 1000, taxMode: "cgst_sgst", taxRate: 18 });
    expect(r.lines).toEqual([
      { label: "CGST 9%", rate: 9, amount: 90 },
      { label: "SGST 9%", rate: 9, amount: 90 },
    ]);
    expect(r.totalTax).toBe(180);
  });

  it("handles odd cgst_sgst rate by rounding each half independently", () => {
    const r = computeDocumentTax({ taxableSubtotal: 100, taxMode: "cgst_sgst", taxRate: 5 });
    // 2.5% of 100 = 2.5 each; total = 5
    expect(r.lines.map((l) => l.amount)).toEqual([2.5, 2.5]);
    expect(r.totalTax).toBe(5);
  });

  it("rounds to 2 decimals", () => {
    const r = computeDocumentTax({ taxableSubtotal: 333.33, taxMode: "vat", taxRate: 5 });
    expect(r.lines[0].amount).toBe(16.67);
    expect(r.totalTax).toBe(16.67);
  });

  it("exposes a parseable enum and labels", () => {
    expect(taxModeSchema.parse("cgst_sgst")).toBe("cgst_sgst");
    expect(TAX_MODE_LABELS.cgst_sgst).toBe("CGST + SGST");
  });
});
