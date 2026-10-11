import { describe, expect, it } from "vitest";

import {
  cookiePreferencesSchema,
  storedCookieConsentSchema,
  syncAnonymousConsentSchema,
} from "./legal";

describe("cookiePreferencesSchema", () => {
  it("accepts boolean toggles", () => {
    const result = cookiePreferencesSchema.safeParse({
      analytics: true,
      marketing: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean values", () => {
    const result = cookiePreferencesSchema.safeParse({
      analytics: "yes",
      marketing: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("storedCookieConsentSchema", () => {
  it("requires ISO updatedAt", () => {
    const result = storedCookieConsentSchema.safeParse({
      analytics: false,
      marketing: false,
      updatedAt: "2026-07-01T12:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("syncAnonymousConsentSchema", () => {
  it("accepts client sync payload", () => {
    const result = syncAnonymousConsentSchema.safeParse({
      analytics: true,
      marketing: true,
      updatedAt: "2026-07-01T12:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});
