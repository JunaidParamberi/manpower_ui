// components/features/documents/sheets/sheet-totals-tds.test.ts
import { describe, expect, it } from "vitest";
import { computeSheetTotals, type SheetLineItem } from "./types";

/** Helper — builds a minimal SheetLineItem */
function item(
  id: string,
  quantity: number,
  unitPrice: number,
  taxRate = 0,
): SheetLineItem {
  return {
    id,
    description: `Item ${id}`,
    subDescription: null,
    quantity,
    unitPrice,
    taxRate,
  };
}

describe("computeSheetTotals — TDS", () => {
  it("TDS disabled: tds=0, tdsRate=null, netReceived=total", () => {
    // subtotal=1000, no tax, no discount
    const t = computeSheetTotals(
      [item("1", 1, 1000)],
      0,
      "percent",
      "none",
      0,
      false,
      10,
    );
    expect(t.tds).toBe(0);
    expect(t.tdsRate).toBeNull();
    expect(t.netReceived).toBe(t.total);
    expect(t.total).toBe(1000);
  });

  it("TDS enabled @ 10%, base 1000: tds=100, netReceived=total-100", () => {
    // subtotal=1000, no discount, no tax → total=1000; TDS base=1000, 10%=100
    const t = computeSheetTotals(
      [item("1", 1, 1000)],
      0,
      "percent",
      "none",
      0,
      true,
      10,
    );
    expect(t.tds).toBe(100);
    expect(t.tdsRate).toBe(10);
    expect(t.netReceived).toBe(900);
  });

  it("TDS enabled with GST: TDS base is pre-GST taxable (subtotal−discount), not total", () => {
    // subtotal=1000, GST 18% on taxable 1000 → totalTax=180, total=1180
    // TDS base = taxableSubtotal = 1000, TDS 10% = 100
    // netReceived = 1180 - 100 = 1080
    const t = computeSheetTotals(
      [item("1", 1, 1000)],
      0,
      "percent",
      "gst",
      18,
      true,
      10,
    );
    expect(t.tds).toBe(100);
    expect(t.tdsRate).toBe(10);
    expect(t.netReceived).toBe(1080);
    expect(t.total).toBe(1180); // billed total unchanged
  });

  it("TDS base is after discount (subtotal − discount)", () => {
    // subtotal=1000, discount=100 flat → taxable=900, no tax → total=900
    // TDS 10% of 900 = 90; netReceived=900-90=810
    const t = computeSheetTotals(
      [item("1", 1, 1000)],
      100,
      "flat",
      "none",
      0,
      true,
      10,
    );
    expect(t.tds).toBe(90);
    expect(t.tdsRate).toBe(10);
    expect(t.netReceived).toBe(810);
  });

  it("TDS rate=0 with enabled=true: treated same as disabled (tds=0, tdsRate=null)", () => {
    const t = computeSheetTotals(
      [item("1", 1, 1000)],
      0,
      "percent",
      "none",
      0,
      true,
      0,
    );
    expect(t.tds).toBe(0);
    expect(t.tdsRate).toBeNull();
    expect(t.netReceived).toBe(t.total);
  });

  it("rounding: 10% of 333 = 33.30", () => {
    // subtotal=333, no discount, no tax → total=333
    // TDS 10% of 333 = 33.30; netReceived=333-33.30=299.70
    const t = computeSheetTotals(
      [item("1", 1, 333)],
      0,
      "percent",
      "none",
      0,
      true,
      10,
    );
    expect(t.tds).toBe(33.3);
    expect(t.netReceived).toBe(299.7);
  });
});
