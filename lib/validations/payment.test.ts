import { describe, it, expect } from "vitest";
import { markPaidInputSchema, paymentMethodSchema } from "./payment";

describe("paymentMethodSchema", () => {
  it("accepts valid methods", () => {
    const methods = ["bank_transfer", "cash", "cheque", "card", "other"] as const;
    for (const m of methods) {
      expect(paymentMethodSchema.parse(m)).toBe(m);
    }
  });

  it("rejects invalid method", () => {
    expect(() => paymentMethodSchema.parse("wire")).toThrow();
    expect(() => paymentMethodSchema.parse("")).toThrow();
  });
});

describe("markPaidInputSchema", () => {
  it("accepts a full payment amount with method only", () => {
    const result = markPaidInputSchema.parse({ method: "cash", amount: 250 });
    expect(result.method).toBe("cash");
    expect(result.amount).toBe(250);
    expect(result.reference).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });

  it("accepts a partial payment kept as balance due", () => {
    const result = markPaidInputSchema.parse({
      method: "bank_transfer",
      amount: 400,
      remainingAction: "keep_due",
    });
    expect(result.remainingAction).toBe("keep_due");
  });

  it("accepts a partial payment with a write-off reason", () => {
    const result = markPaidInputSchema.parse({
      method: "card",
      amount: 400,
      remainingAction: "write_off",
      writeOffReason: "Goodwill adjustment",
    });
    expect(result.remainingAction).toBe("write_off");
    expect(result.writeOffReason).toBe("Goodwill adjustment");
  });

  it("accepts method with reference and notes", () => {
    const result = markPaidInputSchema.parse({
      method: "cheque",
      amount: 250,
      reference: "CHQ-12345",
      notes: "Paid in full",
    });
    expect(result.method).toBe("cheque");
    expect(result.reference).toBe("CHQ-12345");
    expect(result.notes).toBe("Paid in full");
  });

  it("accepts bank_transfer with long reference", () => {
    const result = markPaidInputSchema.parse({
      method: "bank_transfer",
      amount: 250,
      reference: "A".repeat(200),
    });
    expect(result.reference).toHaveLength(200);
  });

  it("rejects zero or negative amounts", () => {
    expect(() =>
      markPaidInputSchema.parse({ method: "cash", amount: 0 })
    ).toThrow();
    expect(() =>
      markPaidInputSchema.parse({ method: "cash", amount: -10 })
    ).toThrow();
  });

  it("rejects write-off without a reason", () => {
    expect(() =>
      markPaidInputSchema.parse({
        method: "cash",
        amount: 100,
        remainingAction: "write_off",
      })
    ).toThrow();
  });

  it("rejects reference over 200 chars", () => {
    expect(() =>
      markPaidInputSchema.parse({ method: "card", amount: 250, reference: "A".repeat(201) })
    ).toThrow();
  });

  it("rejects notes over 500 chars", () => {
    expect(() =>
      markPaidInputSchema.parse({ method: "other", amount: 250, notes: "N".repeat(501) })
    ).toThrow();
  });

  it("rejects missing method", () => {
    expect(() => markPaidInputSchema.parse({})).toThrow();
  });

  it("rejects invalid method value", () => {
    expect(() => markPaidInputSchema.parse({ method: "paypal" })).toThrow();
  });

  it("rejects non-object input", () => {
    expect(() => markPaidInputSchema.parse(null)).toThrow();
    expect(() => markPaidInputSchema.parse("cash")).toThrow();
  });

  it("accepts and parses valid fxRate", () => {
    const result = markPaidInputSchema.parse({
      method: "bank_transfer",
      amount: 100,
      fxRate: 3.6725,
    });
    expect(result.fxRate).toBe(3.6725);
  });

  it("rejects negative or zero fxRate", () => {
    expect(() =>
      markPaidInputSchema.parse({ method: "cash", amount: 100, fxRate: 0 })
    ).toThrow();
    expect(() =>
      markPaidInputSchema.parse({ method: "cash", amount: 100, fxRate: -1.5 })
    ).toThrow();
  });
});
