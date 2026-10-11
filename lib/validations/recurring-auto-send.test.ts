import { describe, expect, it } from "vitest";

import { parseRecurringAutoSend } from "./recurring-auto-send";

const valid = {
  documentId: "3f1a2b4c-5d6e-4f70-8a91-b2c3d4e5f607",
  userId: "9e8d7c6b-5a49-4837-9261-0f1e2d3c4b5a",
};

describe("parseRecurringAutoSend", () => {
  it("accepts a well-formed request", () => {
    const result = parseRecurringAutoSend(valid);
    expect(result).toEqual({ ok: true, data: valid });
  });

  it("rejects a non-uuid document id", () => {
    const result = parseRecurringAutoSend({ ...valid, documentId: "42" });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing user id", () => {
    const result = parseRecurringAutoSend({ documentId: valid.documentId });
    expect(result.ok).toBe(false);
  });

  it("rejects a non-object body", () => {
    expect(parseRecurringAutoSend(null).ok).toBe(false);
    expect(parseRecurringAutoSend("nope").ok).toBe(false);
  });

  it("ignores unknown fields rather than trusting them", () => {
    const result = parseRecurringAutoSend({ ...valid, recipientEmail: "x@y.z" });
    expect(result).toEqual({ ok: true, data: valid });
  });
});
