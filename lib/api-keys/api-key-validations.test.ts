import { describe, expect, it } from "vitest";

import {
  API_KEY_TYPES,
  bearerSecretSchema,
  createApiKeySchema,
  revokeApiKeySchema,
} from "./api-key-validations";
import { generateApiKey } from "./keygen";

describe("createApiKeySchema", () => {
  it("accepts a minimal create payload", () => {
    const result = createApiKeySchema.safeParse({ name: "Claude Desktop" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Claude Desktop");
      expect(result.data.type).toBe("app");
      expect(result.data.description).toBe("");
      expect(result.data.expiresAt).toBeUndefined();
    }
  });

  it("trims names", () => {
    const result = createApiKeySchema.safeParse({ name: "  Zapier  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Zapier");
  });

  it("rejects blank and overlong names", () => {
    expect(createApiKeySchema.safeParse({ name: "   " }).success).toBe(false);
    expect(createApiKeySchema.safeParse({ name: "x".repeat(81) }).success).toBe(false);
  });

  it("accepts every key type", () => {
    for (const type of API_KEY_TYPES) {
      expect(createApiKeySchema.safeParse({ name: "k", type }).success).toBe(true);
    }
    expect(createApiKeySchema.safeParse({ name: "k", type: "wat" }).success).toBe(false);
  });

  it("accepts ISO expiry and a plain date; rejects garbage", () => {
    expect(
      createApiKeySchema.safeParse({ name: "k", expiresAt: "2027-01-01T00:00:00Z" }).success,
    ).toBe(true);
    expect(
      createApiKeySchema.safeParse({ name: "k", expiresAt: "2027-01-01" }).success,
    ).toBe(true);
    expect(
      createApiKeySchema.safeParse({ name: "k", expiresAt: "not a date" }).success,
    ).toBe(false);
  });
});

describe("revokeApiKeySchema", () => {
  it("requires a uuid", () => {
    expect(revokeApiKeySchema.safeParse({ id: "00000000-0000-4000-8000-000000000000" }).success).toBe(true);
    expect(revokeApiKeySchema.safeParse({ id: "nope" }).success).toBe(false);
    expect(revokeApiKeySchema.safeParse({}).success).toBe(false);
  });
});

describe("bearerSecretSchema", () => {
  it("accepts a generated key", () => {
    expect(bearerSecretSchema.safeParse(generateApiKey().secret).success).toBe(true);
  });

  it("rejects junk without hashing it", () => {
    expect(bearerSecretSchema.safeParse("").success).toBe(false);
    expect(bearerSecretSchema.safeParse("sk-proj-1234").success).toBe(false);
    expect(bearerSecretSchema.safeParse("ca_zzzzzzzz").success).toBe(false);
  });
});