import { describe, expect, it } from "vitest";

import {
  buildConsentLogRow,
  formatConsentActionLabel,
  formatConsentTypeLabel,
} from "./consent-log";

describe("buildConsentLogRow", () => {
  it("maps input to insert row", () => {
    expect(
      buildConsentLogRow({
        userId: "user-1",
        consentType: "cookies",
        action: "updated",
        policyVersion: "2026-07-01",
        metadata: { analytics: true, marketing: false },
      }),
    ).toEqual({
      user_id: "user-1",
      consent_type: "cookies",
      action: "updated",
      policy_version: "2026-07-01",
      metadata: { analytics: true, marketing: false },
    });
  });

  it("defaults metadata to null", () => {
    expect(
      buildConsentLogRow({
        userId: "user-1",
        consentType: "terms",
        action: "accepted",
        policyVersion: "2026-07-01",
      }).metadata,
    ).toBeNull();
  });
});

describe("formatConsentTypeLabel", () => {
  it("returns human labels", () => {
    expect(formatConsentTypeLabel("terms")).toBe("Terms of Service");
    expect(formatConsentTypeLabel("privacy")).toBe("Privacy Policy");
    expect(formatConsentTypeLabel("cookies")).toBe("Cookie preferences");
  });
});

describe("formatConsentActionLabel", () => {
  it("returns human labels", () => {
    expect(formatConsentActionLabel("accepted")).toBe("Accepted");
    expect(formatConsentActionLabel("updated")).toBe("Updated");
    expect(formatConsentActionLabel("revoked")).toBe("Revoked");
  });
});
