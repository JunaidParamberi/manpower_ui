import { describe, it, expect } from "vitest";

import {
  computeZatcaAmounts,
  encodeZatcaTlv,
  shouldShowZatcaQr,
} from "./zatca-qr";

/** Minimal TLV parser used only to assert the encoder's byte layout. */
function decodeTlv(base64: string): { tag: number; value: string }[] {
  const bytes = Uint8Array.from(Buffer.from(base64, "base64"));
  const decoder = new TextDecoder();
  const out: { tag: number; value: string }[] = [];
  let i = 0;
  while (i < bytes.length) {
    const tag = bytes[i];
    const length = bytes[i + 1];
    const value = decoder.decode(bytes.subarray(i + 2, i + 2 + length));
    out.push({ tag, value });
    i += 2 + length;
  }
  return out;
}

describe("encodeZatcaTlv", () => {
  const sample = {
    sellerName: "Acme Studio",
    vatNumber: "300000000000003",
    timestamp: "2026-06-20T10:30:00Z",
    total: 1150,
    vatTotal: 150,
  };

  it("produces a valid base64 string", () => {
    const result = encodeZatcaTlv(sample);
    expect(typeof result).toBe("string");
    expect(() => Buffer.from(result, "base64")).not.toThrow();
  });

  it("encodes the five mandatory tags in order", () => {
    const fields = decodeTlv(encodeZatcaTlv(sample));
    expect(fields.map((f) => f.tag)).toEqual([1, 2, 3, 4, 5]);
  });

  it("maps each tag to its value", () => {
    const fields = decodeTlv(encodeZatcaTlv(sample));
    expect(fields[0].value).toBe("Acme Studio");
    expect(fields[1].value).toBe("300000000000003");
    expect(fields[2].value).toBe("2026-06-20T10:30:00Z");
  });

  it("formats amounts to two decimal places", () => {
    const fields = decodeTlv(encodeZatcaTlv(sample));
    expect(fields[3].value).toBe("1150.00");
    expect(fields[4].value).toBe("150.00");
  });

  it("uses the UTF-8 byte length for the TLV length byte (multi-byte names)", () => {
    const arabic = "مؤسسة";
    const bytes = Uint8Array.from(
      Buffer.from(encodeZatcaTlv({ ...sample, sellerName: arabic }), "base64"),
    );
    // Layout: [tag=1][length][value...]; length must be the byte count, not char count.
    expect(bytes[0]).toBe(1);
    expect(bytes[1]).toBe(new TextEncoder().encode(arabic).length);
    expect(bytes[1]).toBeGreaterThan(arabic.length);
  });

  it("round-trips the seller name through encode/decode", () => {
    const fields = decodeTlv(encodeZatcaTlv({ ...sample, sellerName: "مؤسسة" }));
    expect(fields[0].value).toBe("مؤسسة");
  });

  it("produces a deterministic value for identical input", () => {
    expect(encodeZatcaTlv(sample)).toBe(encodeZatcaTlv(sample));
  });
});

describe("shouldShowZatcaQr", () => {
  const base = {
    taxMode: "vat" as const,
    sellerCountry: "SA",
    vatNumber: "300000000000003",
  };

  it("returns true for a KSA VAT invoice with a TRN", () => {
    expect(shouldShowZatcaQr(base)).toBe(true);
  });

  it("is case-insensitive on the seller country", () => {
    expect(shouldShowZatcaQr({ ...base, sellerCountry: "sa" })).toBe(true);
  });

  it("returns false when seller is not in Saudi Arabia", () => {
    expect(shouldShowZatcaQr({ ...base, sellerCountry: "AE" })).toBe(false);
  });

  it("returns false when tax mode is not VAT", () => {
    expect(shouldShowZatcaQr({ ...base, taxMode: "gst" })).toBe(false);
    expect(shouldShowZatcaQr({ ...base, taxMode: "none" })).toBe(false);
  });

  it("returns false when the VAT number is missing", () => {
    expect(shouldShowZatcaQr({ ...base, vatNumber: null })).toBe(false);
    expect(shouldShowZatcaQr({ ...base, vatNumber: "  " })).toBe(false);
  });

  it("returns false when seller country is missing", () => {
    expect(shouldShowZatcaQr({ ...base, sellerCountry: null })).toBe(false);
  });
});

describe("computeZatcaAmounts", () => {
  const lineItems = [
    { quantity: 2, unit_price: 100 },
    { quantity: 1, unit_price: 300 },
  ];

  it("computes VAT total and inclusive total", () => {
    const { total, vatTotal } = computeZatcaAmounts({
      lineItems,
      taxMode: "vat",
      taxRate: 15,
    });
    // subtotal 500, VAT 15% = 75, total 575
    expect(vatTotal).toBe(75);
    expect(total).toBe(575);
  });

  it("applies a percentage discount before tax", () => {
    const { total, vatTotal } = computeZatcaAmounts({
      lineItems,
      discountValue: 10,
      discountType: "percent",
      taxMode: "vat",
      taxRate: 15,
    });
    // taxable 450, VAT 67.5, total 517.5
    expect(vatTotal).toBe(67.5);
    expect(total).toBe(517.5);
  });

  it("applies a flat discount before tax", () => {
    const { total, vatTotal } = computeZatcaAmounts({
      lineItems,
      discountValue: 100,
      discountType: "flat",
      taxMode: "vat",
      taxRate: 15,
    });
    // taxable 400, VAT 60, total 460
    expect(vatTotal).toBe(60);
    expect(total).toBe(460);
  });

  it("returns zero VAT when tax mode is none", () => {
    const { total, vatTotal } = computeZatcaAmounts({
      lineItems,
      taxMode: "none",
      taxRate: 0,
    });
    expect(vatTotal).toBe(0);
    expect(total).toBe(500);
  });
});
