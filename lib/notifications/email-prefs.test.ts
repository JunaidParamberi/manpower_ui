import { describe, expect, it } from "vitest";

import {
  isEmailEnabledForEvent,
  NOTIFICATION_EMAIL_DEFAULTS,
  resolveEmailPrefs,
} from "./email-prefs";

describe("resolveEmailPrefs", () => {
  it("returns defaults for empty stored prefs", () => {
    expect(resolveEmailPrefs({})).toEqual(NOTIFICATION_EMAIL_DEFAULTS);
  });

  it("merges stored overrides with defaults", () => {
    const prefs = resolveEmailPrefs({ invoice_paid: false });
    expect(prefs.invoice_paid).toBe(false);
    expect(prefs.quote_approved).toBe(true);
    expect(prefs.doc_sent).toBe(false);
  });

  it("ignores invalid stored values", () => {
    const prefs = resolveEmailPrefs({
      invoice_paid: "yes",
      quote_approved: false,
    });
    expect(prefs.invoice_paid).toBe(true);
    expect(prefs.quote_approved).toBe(false);
  });
});

describe("isEmailEnabledForEvent", () => {
  it("reads resolved prefs", () => {
    const prefs = resolveEmailPrefs({ doc_sent: true });
    expect(isEmailEnabledForEvent(prefs, "doc_sent")).toBe(true);
    expect(isEmailEnabledForEvent(prefs, "invoice_paid")).toBe(true);
  });
});
