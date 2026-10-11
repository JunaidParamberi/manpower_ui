import { describe, expect, it } from "vitest";
import {
  calculateInvoiceBalance,
  calculateInvoiceTotal,
  getInvoicePaymentStatus,
} from "./payment-balance";

describe("calculateInvoiceBalance", () => {
  it("calculates remaining balance from total, payments, and write-offs", () => {
    const result = calculateInvoiceBalance({
      invoiceTotal: 1000,
      payments: [250, 150],
      writeOffs: [100],
    });

    expect(result.totalPaid).toBe(400);
    expect(result.totalWrittenOff).toBe(100);
    expect(result.balanceDue).toBe(500);
  });

  it("clamps tiny floating point balances to zero", () => {
    const result = calculateInvoiceBalance({
      invoiceTotal: 0.3,
      payments: [0.1, 0.2],
      writeOffs: [],
    });

    expect(result.balanceDue).toBe(0);
  });
});

describe("getInvoicePaymentStatus", () => {
  it("marks invoice paid when payments cover the full balance", () => {
    expect(
      getInvoicePaymentStatus({
        invoiceTotal: 1000,
        totalPaid: 1000,
        totalWrittenOff: 0,
      }),
    ).toBe("paid");
  });

  it("marks invoice partially paid when a balance remains after payment", () => {
    expect(
      getInvoicePaymentStatus({
        invoiceTotal: 1000,
        totalPaid: 400,
        totalWrittenOff: 0,
      }),
    ).toBe("partially_paid");
  });

  it("marks invoice written off when the remaining balance is adjusted away", () => {
    expect(
      getInvoicePaymentStatus({
        invoiceTotal: 1000,
        totalPaid: 400,
        totalWrittenOff: 600,
      }),
    ).toBe("written_off");
  });
});

describe("calculateInvoiceTotal", () => {
  it("sums qty * unit_price + tax", () => {
    const items = [
      { quantity: 2, unit_price: 100, tax_rate: 10 },
      { quantity: 1, unit_price: 200, tax_rate: 5 },
    ];
    // subtotal = 2*100 + 1*200 = 400, tax = 2*100*0.1 + 1*200*0.05 = 20+10=30, total=430
    expect(calculateInvoiceTotal(items, 0, "percent")).toBe(430);
  });

  it("applies percent discount after computing full tax", () => {
    const items = [{ quantity: 1, unit_price: 100, tax_rate: 10 }];
    // subtotal=100, net=90, tax=90*10%=9, total=99
    expect(calculateInvoiceTotal(items, 10, "percent")).toBeCloseTo(99, 2);
  });

  it("applies flat discount after computing full tax", () => {
    const items = [{ quantity: 1, unit_price: 100, tax_rate: 10 }];
    // subtotal=100, net=80, tax=80*10%=8, total=88
    expect(calculateInvoiceTotal(items, 20, "flat")).toBeCloseTo(88, 2);
  });

  it("clamps flat discount to subtotal", () => {
    const items = [{ quantity: 1, unit_price: 50, tax_rate: 0 }];
    expect(calculateInvoiceTotal(items, 200, "flat")).toBe(0);
  });
});

describe("calculateInvoiceTotal — tax on net of discount", () => {
  it("applies tax after percent discount", () => {
    // 1 item: qty=1, unit_price=100, tax_rate=5, discount=10%
    // Correct: subtotal=100, discount=10, net=90, tax=90*5%=4.50, total=94.50
    const result = calculateInvoiceTotal(
      [{ quantity: 1, unit_price: 100, tax_rate: 5 }],
      10,
      "percent",
    );
    expect(result).toBeCloseTo(94.5, 2);
  });

  it("applies tax after flat discount", () => {
    // qty=2, unit_price=50, tax_rate=10, discount=20 flat
    // subtotal=100, discount=20, net=80, tax=80*10%=8, total=88
    const result = calculateInvoiceTotal(
      [{ quantity: 2, unit_price: 50, tax_rate: 10 }],
      20,
      "flat",
    );
    expect(result).toBeCloseTo(88, 2);
  });

  it("handles mixed tax rates with percent discount", () => {
    // item1: qty=1, price=100, tax=5; item2: qty=1, price=100, tax=10
    // subtotal=200, discount=10% => 20 discount
    // item1 net=90, tax=4.5; item2 net=90, tax=9; total=193.5
    const result = calculateInvoiceTotal(
      [
        { quantity: 1, unit_price: 100, tax_rate: 5 },
        { quantity: 1, unit_price: 100, tax_rate: 10 },
      ],
      10,
      "percent",
    );
    expect(result).toBeCloseTo(193.5, 2);
  });

  it("zero discount — same as before", () => {
    const result = calculateInvoiceTotal(
      [{ quantity: 1, unit_price: 100, tax_rate: 5 }],
      0,
      "percent",
    );
    expect(result).toBeCloseTo(105, 2);
  });

  it("clamps percent discount over 100 to prevent negative totals", () => {
    // 150% discount is clamped to 100% => total = 0 (all lines at 0 net, no tax)
    const result = calculateInvoiceTotal(
      [{ quantity: 1, unit_price: 100, tax_rate: 5 }],
      150,
      "percent",
    );
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeCloseTo(0, 2);
  });
});

describe("calculateInvoiceTotal — per-line rounding prevents cent drift", () => {
  it("rounds per-line gross before summing — no cent drift", () => {
    // Classic float drift: 0.1 + 0.2 = 0.30000000000000004 without rounding
    const items = [
      { quantity: 1, unit_price: 0.1, tax_rate: 0 },
      { quantity: 1, unit_price: 0.2, tax_rate: 0 },
    ];
    expect(calculateInvoiceTotal(items, 0, "percent")).toBe(0.3);
  });

  it("result is rounded to 2 decimal places", () => {
    const items = [{ quantity: 3, unit_price: 0.333, tax_rate: 0 }];
    const result = calculateInvoiceTotal(items, 0, "percent");
    // 3 * 0.333 = 0.999, rounded = 1.00
    expect(Number.isInteger(result * 100)).toBe(true);
  });

  it("per-line tax is rounded before summing", () => {
    // 1 item: qty=1, price=10.005, tax=10% → line gross rounds to 10.01, tax = 10.01*0.1 = 1.001 → rounds to 1.00
    const items = [{ quantity: 1, unit_price: 10.005, tax_rate: 10 }];
    const result = calculateInvoiceTotal(items, 0, "percent");
    // subtotal=10.01, tax=1.00, total=11.01
    expect(result).toBe(11.01);
  });
});
describe("calculateInvoiceTotal — document VAT", () => {
  it("includes document-level VAT so balances match the invoice", () => {
    expect(
      calculateInvoiceTotal(
        [{ quantity: 1, unit_price: 10000, tax_rate: 0 }],
        0,
        "percent",
        { taxMode: "vat", taxRate: 5 },
      ),
    ).toBe(10500);
  });
});
