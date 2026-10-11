import { describe, expect, it } from "vitest";

import { globalSearchSchema } from "./global-search";

describe("globalSearchSchema", () => {
  it("accepts a trimmed query", () => {
    expect(globalSearchSchema.safeParse({ query: "  acme  " }).success).toBe(true);
    expect(globalSearchSchema.parse({ query: "  acme  " }).query).toBe("acme");
  });

  it("rejects empty query", () => {
    expect(globalSearchSchema.safeParse({ query: "   " }).success).toBe(false);
  });

  it("rejects query longer than 80 characters", () => {
    expect(
      globalSearchSchema.safeParse({ query: "a".repeat(81) }).success,
    ).toBe(false);
  });

  it("rejects missing query", () => {
    expect(globalSearchSchema.safeParse({}).success).toBe(false);
  });
});
