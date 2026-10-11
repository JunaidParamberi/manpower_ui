// components/features/documents/sheets/types.test.ts
import { describe, expect, it } from "vitest";
import { computeSheetTotals, type SheetLineItem } from "./types";

const items: SheetLineItem[] = [
  { id: "1", description: "Design", subDescription: null, quantity: 2, unitPrice: 500, taxRate: 0 },
];

describe("computeSheetTotals tax", () => {
  it("adds no tax for none mode", () => {
    const t = computeSheetTotals(items, 0, "percent", "none", 0);
    expect(t.tax).toBe(0);
    expect(t.taxLines).toEqual([]);
    expect(t.total).toBe(1000);
  });

  it("shows a tax line when tax lives on line items (mode none)", () => {
    const lineTaxed: SheetLineItem[] = [
      { id: "1", description: "Build", subDescription: null, quantity: 1, unitPrice: 10000, taxRate: 5 },
    ];
    const t = computeSheetTotals(lineTaxed, 0, "percent", "none", 0);
    expect(t.tax).toBe(500);
    expect(t.total).toBe(10500);
    expect(t.taxLines).toEqual([{ label: "Tax 5%", rate: 5, amount: 500 }]);
    expect(t.taxLabel).toBe("Tax 5%");
  });

  it("labels mixed line-item tax rates as plain Tax", () => {
    const mixed: SheetLineItem[] = [
      { id: "1", description: "A", subDescription: null, quantity: 1, unitPrice: 100, taxRate: 5 },
      { id: "2", description: "B", subDescription: null, quantity: 1, unitPrice: 100, taxRate: 10 },
    ];
    const t = computeSheetTotals(mixed, 0, "percent", "none", 0);
    expect(t.taxLines).toEqual([{ label: "Tax", rate: 0, amount: 15 }]);
  });

  it("applies VAT on discounted subtotal", () => {
    const t = computeSheetTotals(items, 100, "flat", "vat", 5);
    // subtotal 1000, discount 100 -> taxable 900, VAT 5% = 45
    expect(t.taxLines).toEqual([{ label: "VAT 5%", rate: 5, amount: 45 }]);
    expect(t.tax).toBe(45);
    expect(t.total).toBe(945);
  });

  it("splits cgst_sgst", () => {
    const t = computeSheetTotals(items, 0, "percent", "cgst_sgst", 18);
    expect(t.taxLines.map((l) => l.label)).toEqual(["CGST 9%", "SGST 9%"]);
    expect(t.tax).toBe(180);
    expect(t.total).toBe(1180);
  });
});
