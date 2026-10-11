import { describe, expect, it } from "vitest";

import {
  parseClientPortalActionInput,
  parsePortalTokenInput,
} from "@/lib/validations/portal";

describe("parsePortalTokenInput", () => {
  it("accepts a 48-char hex token", () => {
    const token = "a".repeat(48);
    const result = parsePortalTokenInput(token);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(token);
    }
  });

  it("rejects short or non-hex tokens", () => {
    expect(parsePortalTokenInput("abc").success).toBe(false);
    expect(parsePortalTokenInput("g".repeat(48)).success).toBe(false);
    expect(parsePortalTokenInput("").success).toBe(false);
  });
});

describe("parseClientPortalActionInput", () => {
  it("accepts a valid client UUID", () => {
    const result = parseClientPortalActionInput({
      clientId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid client id", () => {
    expect(parseClientPortalActionInput({ clientId: "not-uuid" }).success).toBe(
      false,
    );
  });
});
