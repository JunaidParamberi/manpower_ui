import { describe, it, expect } from "vitest";
import { serviceInputSchema } from "./service";

describe("serviceInputSchema", () => {
  it("accepts a minimal valid service", () => {
    const result = serviceInputSchema.safeParse({ name: "Design retainer" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Design retainer");
      expect(result.data.default_rate).toBe(0);
      expect(result.data.default_tax_mode).toBe("none");
      expect(result.data.default_tax_rate).toBe(0);
    }
  });

  it("rejects empty name", () => {
    const result = serviceInputSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name over 200 chars", () => {
    const result = serviceInputSchema.safeParse({ name: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects description over 500 chars", () => {
    const result = serviceInputSchema.safeParse({
      name: "Design",
      description: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative rate", () => {
    const result = serviceInputSchema.safeParse({ name: "X", default_rate: -1 });
    expect(result.success).toBe(false);
  });

  it("forces tax_rate to 0 when tax_mode is none", () => {
    const result = serviceInputSchema.safeParse({
      name: "X",
      default_tax_mode: "none",
      default_tax_rate: 20,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.default_tax_rate).toBe(0);
  });

  it("accepts valid tax mode and rate", () => {
    const result = serviceInputSchema.safeParse({
      name: "X",
      default_tax_mode: "vat",
      default_tax_rate: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid tax mode", () => {
    const result = serviceInputSchema.safeParse({
      name: "X",
      default_tax_mode: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid 6-digit HSN code", () => {
    const result = serviceInputSchema.safeParse({
      name: "X",
      hsn_sac_code: "998391",
    });
    expect(result.success).toBe(true);
  });

  it("rejects HSN code with letters", () => {
    const result = serviceInputSchema.safeParse({
      name: "X",
      hsn_sac_code: "99AB91",
    });
    expect(result.success).toBe(false);
  });

  it("rejects HSN code shorter than 4 digits", () => {
    const result = serviceInputSchema.safeParse({
      name: "X",
      hsn_sac_code: "123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null HSN code", () => {
    const result = serviceInputSchema.safeParse({ name: "X", hsn_sac_code: null });
    expect(result.success).toBe(true);
  });

  it("converts empty HSN string to null", () => {
    const result = serviceInputSchema.safeParse({ name: "X", hsn_sac_code: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.hsn_sac_code).toBeNull();
  });
});
