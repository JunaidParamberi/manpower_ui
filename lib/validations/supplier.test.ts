import { describe, expect, it } from "vitest";
import { supplierInputSchema } from "./supplier";

describe("supplierInputSchema", () => {
  it("requires a name", () => {
    const result = supplierInputSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a minimal valid payload", () => {
    const result = supplierInputSchema.safeParse({ name: "Acme Manpower" });
    expect(result.success).toBe(true);
  });
});
