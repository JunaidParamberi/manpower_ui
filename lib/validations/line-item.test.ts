import { describe, it, expect } from "vitest";
import { lineItemInputSchema, parseLineItemInput, parseLineItemInputSafe, normalizeHsnSacCode } from "./line-item";

// ---------------------------------------------------------------------------
// lineItemInputSchema — defaults
// ---------------------------------------------------------------------------
describe("lineItemInputSchema defaults", () => {
  it("quantity defaults to 1", () => {
    const result = lineItemInputSchema.parse({});
    expect(result.quantity).toBe(1);
  });

  it("unit_price defaults to 0", () => {
    const result = lineItemInputSchema.parse({});
    expect(result.unit_price).toBe(0);
  });

  it("tax_rate defaults to 0", () => {
    const result = lineItemInputSchema.parse({});
    expect(result.tax_rate).toBe(0);
  });

  it("sort_order defaults to 0", () => {
    expect(lineItemInputSchema.parse({}).sort_order).toBe(0);
  });

  it("description defaults to empty string", () => {
    expect(lineItemInputSchema.parse({}).description).toBe("");
  });
});

// ---------------------------------------------------------------------------
// lineItemInputSchema — coercion
// ---------------------------------------------------------------------------
describe("lineItemInputSchema coercion", () => {
  it("coerces string quantity to number", () => {
    expect(lineItemInputSchema.parse({ quantity: "3" }).quantity).toBe(3);
  });

  it("coerces string unit_price to number", () => {
    expect(lineItemInputSchema.parse({ unit_price: "99.99" }).unit_price).toBe(99.99);
  });

  it("coerces string tax_rate to number", () => {
    expect(lineItemInputSchema.parse({ tax_rate: "5" }).tax_rate).toBe(5);
  });

  it("coerces string sort_order to number", () => {
    expect(lineItemInputSchema.parse({ sort_order: "2" }).sort_order).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// lineItemInputSchema — boundary rejects
// ---------------------------------------------------------------------------
describe("lineItemInputSchema boundaries", () => {
  it("rejects quantity = 0 (must be positive)", () => {
    expect(() => lineItemInputSchema.parse({ quantity: 0 })).toThrow();
  });

  it("rejects negative quantity", () => {
    expect(() => lineItemInputSchema.parse({ quantity: -1 })).toThrow();
  });

  it("rejects quantity > 9999", () => {
    expect(() => lineItemInputSchema.parse({ quantity: 10000 })).toThrow();
  });

  it("accepts quantity = 9999 (boundary)", () => {
    expect(lineItemInputSchema.parse({ quantity: 9999 }).quantity).toBe(9999);
  });

  it("rejects unit_price < 0", () => {
    expect(() => lineItemInputSchema.parse({ unit_price: -0.01 })).toThrow();
  });

  it("accepts unit_price = 0", () => {
    expect(lineItemInputSchema.parse({ unit_price: 0 }).unit_price).toBe(0);
  });

  it("rejects tax_rate > 100", () => {
    expect(() => lineItemInputSchema.parse({ tax_rate: 100.01 })).toThrow();
  });

  it("accepts tax_rate = 100 (boundary)", () => {
    expect(lineItemInputSchema.parse({ tax_rate: 100 }).tax_rate).toBe(100);
  });

  it("rejects tax_rate < 0", () => {
    expect(() => lineItemInputSchema.parse({ tax_rate: -1 })).toThrow();
  });

  it("rejects description longer than 500 chars", () => {
    expect(() => lineItemInputSchema.parse({ description: "x".repeat(501) })).toThrow();
  });

  it("accepts description at exactly 500 chars", () => {
    const long = "x".repeat(500);
    expect(lineItemInputSchema.parse({ description: long }).description).toBe(long);
  });
});

describe("lineItemInputSchema hsn_sac_code", () => {
  it("omitted → undefined (field is optional)", () => {
    expect(lineItemInputSchema.parse({}).hsn_sac_code).toBeUndefined();
  });

  it("empty string → null (trimmed away)", () => {
    expect(lineItemInputSchema.parse({ hsn_sac_code: "" }).hsn_sac_code).toBeNull();
  });

  it("null → null", () => {
    expect(lineItemInputSchema.parse({ hsn_sac_code: null }).hsn_sac_code).toBeNull();
  });

  it("valid 4-digit HSN accepts", () => {
    expect(lineItemInputSchema.parse({ hsn_sac_code: "4911" }).hsn_sac_code).toBe("4911");
  });

  it("valid 6-digit SAC accepts", () => {
    expect(lineItemInputSchema.parse({ hsn_sac_code: "998391" }).hsn_sac_code).toBe("998391");
  });

  it("valid 8-digit HSN accepts", () => {
    expect(lineItemInputSchema.parse({ hsn_sac_code: "49119900" }).hsn_sac_code).toBe("49119900");
  });

  it("3-digit code rejects (too short)", () => {
    expect(() => lineItemInputSchema.parse({ hsn_sac_code: "491" })).toThrow();
  });

  it("9-digit code rejects (too long)", () => {
    expect(() => lineItemInputSchema.parse({ hsn_sac_code: "491199001" })).toThrow();
  });

  it("non-numeric code rejects", () => {
    expect(() => lineItemInputSchema.parse({ hsn_sac_code: "9983AB" })).toThrow();
  });

  it("trims whitespace before validation", () => {
    expect(lineItemInputSchema.parse({ hsn_sac_code: " 998391 " }).hsn_sac_code).toBe("998391");
  });
});

describe("normalizeHsnSacCode", () => {
  it("empty → null", () => {
    expect(normalizeHsnSacCode("")).toBeNull();
    expect(normalizeHsnSacCode("   ")).toBeNull();
  });

  it("valid code → trimmed digits", () => {
    expect(normalizeHsnSacCode(" 998391 ")).toBe("998391");
  });

  it("incomplete code → null", () => {
    expect(normalizeHsnSacCode("491")).toBeNull();
  });

  it("non-numeric → null", () => {
    expect(normalizeHsnSacCode("9983AB")).toBeNull();
  });
});

describe("parseLineItemInputSafe", () => {
  it("returns error instead of throwing on invalid hsn", () => {
    const result = parseLineItemInputSafe({ hsn_sac_code: "12" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("HSN/SAC");
    }
  });
});

// ---------------------------------------------------------------------------
// parseLineItemInput
// ---------------------------------------------------------------------------
describe("parseLineItemInput", () => {
  it("parses a valid input", () => {
    const result = parseLineItemInput({
      description: "Design work",
      quantity: "2",
      unit_price: "150",
      tax_rate: "5",
      sort_order: "0",
    });
    expect(result.description).toBe("Design work");
    expect(result.quantity).toBe(2);
    expect(result.unit_price).toBe(150);
    expect(result.tax_rate).toBe(5);
  });

  it("throws on invalid input", () => {
    expect(() => parseLineItemInput({ quantity: -1 })).toThrow();
  });

  it("passes through optional id when present", () => {
    const id = "e4a2f731-57c4-4c2a-b5d8-123456789abc";
    const result = parseLineItemInput({ id });
    expect(result.id).toBe(id);
  });

  it("id is undefined when not provided", () => {
    expect(parseLineItemInput({}).id).toBeUndefined();
  });
});
