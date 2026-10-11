import { describe, expect, it } from "vitest";

import {
  API_KEY_BODY_PATTERN,
  API_KEY_LENGTH,
  API_KEY_PREFIX,
  generateApiKey,
  hashApiKey,
  isApiKeyFormat,
} from "./keygen";

describe("generateApiKey", () => {
  it("produces a key in the ca_ + 40 hex format with a short display prefix", () => {
    const { secret, prefix, hash } = generateApiKey();
    expect(secret).toMatch(new RegExp(`^${API_KEY_PREFIX}[a-f0-9]{40}$`));
    expect(secret).toHaveLength(API_KEY_LENGTH);
    expect(prefix).toBe(secret.slice(0, 12));
  });

  it("is unique across generations", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      seen.add(generateApiKey().secret);
    }
    expect(seen.size).toBe(1000);
  });

  it("never returns the same secret twice in practice (prefix differs)", () => {
    const first = generateApiKey();
    const second = generateApiKey();
    expect(first.secret).not.toBe(second.secret);
  });
});

describe("hashApiKey", () => {
  it("is a deterministic sha256 hex digest", () => {
    const { secret, hash } = generateApiKey();
    expect(hashApiKey(secret)).toBe(hash);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("differs for different secrets", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(hashApiKey(a.secret)).not.toBe(hashApiKey(b.secret));
  });
});

describe("isApiKeyFormat", () => {
  it("accepts generated keys", () => {
    expect(isApiKeyFormat(generateApiKey().secret)).toBe(true);
  });

  it("rejects lookalikes", () => {
    const { secret } = generateApiKey();
    expect(isApiKeyFormat("")).toBe(false);
    expect(isApiKeyFormat("ca_abc")).toBe(false);
    expect(isApiKeyFormat("sk_1234567890abcdefghijklmnopqrstuvwxyz1234")).toBe(false);
    expect(isApiKeyFormat(secret.slice(1))).toBe(false);
    expect(isApiKeyFormat(`${secret.slice(0, -1)}G`)).toBe(false); // non-hex tail
  });
});

describe("API_KEY_BODY_PATTERN", () => {
  it("exactly matches the 40-hex body", () => {
    expect(API_KEY_BODY_PATTERN.test("a".repeat(40))).toBe(true);
    expect(API_KEY_BODY_PATTERN.test("a".repeat(39))).toBe(false);
    expect(API_KEY_BODY_PATTERN.test("A".repeat(40))).toBe(false); // uppercase not allowed
  });
});