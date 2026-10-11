import { describe, expect, it } from "vitest";
import { computeDocumentTotals } from "./compute-document-totals";

const items = [
  { quantity: 2, unit_price: 100, tax_rate: 10 },
  { quantity: 1, unit_price: 50, tax_rate: 5 },
];

describe("computeDocumentTotals", () => {
  it("sums subtotal without discount or tax", () => {
    const t = computeDocumentTotals(
      [
        { quantity: 1, unit_price: 100, tax_rate: 0 },
        { quantity: 2, unit_price: 50, tax_rate: 0 },
      ],
      0,
      "percent",
    );
    expect(t.subtotal).toBe(200);
    expect(t.discount).toBe(0);
    expect(t.taxTotal).toBe(0);
    expect(t.total).toBe(200);
  });

  it("applies percent discount before per-line tax", () => {
    const t = computeDocumentTotals(items, 10, "percent");
    // subtotal=250, discount=25, ratio=0.1
    // line1 net=180, tax=18; line2 net=45, tax=2.25 → tax=20.25, total=245.25
    expect(t.subtotal).toBe(250);
    expect(t.discount).toBe(25);
    expect(t.discountedSubtotal).toBe(225);
    expect(t.taxTotal).toBe(20.25);
    expect(t.total).toBe(245.25);
  });

  it("applies flat discount capped at subtotal", () => {
    const t = computeDocumentTotals(items, 200, "flat");
    expect(t.discount).toBe(200);
    expect(t.discountedSubtotal).toBe(50);
    // Remaining line still has 5% tax on net portion
    expect(t.taxTotal).toBe(4.5);
    expect(t.total).toBe(54.5);
  });

  it("matches calculateInvoiceTotal total for discount+tax combo", () => {
    const t = computeDocumentTotals(
      [{ quantity: 3, unit_price: 33.33, tax_rate: 18 }],
      10,
      "percent",
    );
    expect(t.total).toBeGreaterThan(0);
    expect(t.taxTotal).toBeLessThan(t.total);
  });
});

describe("computeDocumentTotals — document-level tax", () => {
  const untaxed = [{ quantity: 1, unit_price: 10000, tax_rate: 0 }];

  it("applies document VAT to the discounted subtotal", () => {
    const t = computeDocumentTotals(untaxed, 1000, "flat", { taxMode: "vat", taxRate: 5 });
    expect(t.discountedSubtotal).toBe(9000);
    expect(t.taxTotal).toBe(450);
    expect(t.total).toBe(9450);
  });

  it("uses document tax instead of line tax when a tax mode is set", () => {
    const t = computeDocumentTotals(
      [{ quantity: 1, unit_price: 10000, tax_rate: 5 }],
      0,
      "percent",
      { taxMode: "vat", taxRate: 5 },
    );
    expect(t.taxTotal).toBe(500);
    expect(t.total).toBe(10500);
  });

  it("splits CGST + SGST and rounds each half", () => {
    const t = computeDocumentTotals(
      [{ quantity: 1, unit_price: 333.33, tax_rate: 0 }],
      0,
      "percent",
      { taxMode: "cgst_sgst", taxRate: 18 },
    );
    // half = 9% of 333.33 = 29.9997 → 30.00 each
    expect(t.taxTotal).toBe(60);
    expect(t.total).toBe(393.33);
  });

  it("falls back to line tax when mode is none", () => {
    const t = computeDocumentTotals(
      [{ quantity: 1, unit_price: 10000, tax_rate: 5 }],
      0,
      "percent",
      { taxMode: "none", taxRate: 0 },
    );
    expect(t.total).toBe(10500);
  });

  it("accepts Postgres numeric strings", () => {
    const t = computeDocumentTotals(untaxed, 0, "percent", { taxMode: "vat", taxRate: "5.00" });
    expect(t.total).toBe(10500);
  });

  it("ignores an unknown tax mode", () => {
    const t = computeDocumentTotals(untaxed, 0, "percent", { taxMode: "sales_tax", taxRate: 5 });
    expect(t.total).toBe(10000);
  });
});
