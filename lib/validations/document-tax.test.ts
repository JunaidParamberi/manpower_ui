import { describe, expect, it } from "vitest";
import { documentTaxSchema } from "./document-tax";

describe("documentTaxSchema", () => {
  it("accepts a valid mode + rate", () => {
    expect(documentTaxSchema.parse({ tax_mode: "vat", tax_rate: 5 })).toEqual({
      tax_mode: "vat",
      tax_rate: 5,
    });
  });

  it("forces rate to 0 when mode is none", () => {
    expect(documentTaxSchema.parse({ tax_mode: "none", tax_rate: 18 })).toEqual({
      tax_mode: "none",
      tax_rate: 0,
    });
  });

  it("defaults to none / 0", () => {
    expect(documentTaxSchema.parse({})).toEqual({
      tax_mode: "none",
      tax_rate: 0,
    });
  });

  it("rejects rate above 100", () => {
    expect(() =>
      documentTaxSchema.parse({ tax_mode: "vat", tax_rate: 101 })
    ).toThrow();
  });

  it("rejects negative rate", () => {
    expect(() =>
      documentTaxSchema.parse({ tax_mode: "vat", tax_rate: -1 })
    ).toThrow();
  });

  it("rejects unknown mode", () => {
    expect(() =>
      documentTaxSchema.parse({ tax_mode: "sales_tax", tax_rate: 5 })
    ).toThrow();
  });
});
