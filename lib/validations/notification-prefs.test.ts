import { describe, expect, it } from "vitest";

import {
  isNotificationEmailEventKey,
  notificationEmailPrefsSchema,
  updateNotificationEmailPrefsSchema,
} from "./notification-prefs";
import { NOTIFICATION_EMAIL_DEFAULTS } from "@/lib/notifications/email-prefs";

describe("notificationEmailPrefsSchema", () => {
  it("accepts a full record of event toggles", () => {
    const result = notificationEmailPrefsSchema.safeParse(
      NOTIFICATION_EMAIL_DEFAULTS,
    );
    expect(result.success).toBe(true);
  });

  it("rejects partial records", () => {
    const result = notificationEmailPrefsSchema.safeParse({
      invoice_paid: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateNotificationEmailPrefsSchema", () => {
  it("requires a full prefs object", () => {
    const result = updateNotificationEmailPrefsSchema.safeParse({
      prefs: NOTIFICATION_EMAIL_DEFAULTS,
    });
    expect(result.success).toBe(true);
  });
});

describe("isNotificationEmailEventKey", () => {
  it("returns true for known keys", () => {
    expect(isNotificationEmailEventKey("invoice_paid")).toBe(true);
  });

  it("returns true for task_due", () => {
    expect(isNotificationEmailEventKey("task_due")).toBe(true);
  });

  it("returns false for unknown keys", () => {
    expect(isNotificationEmailEventKey("unknown_event")).toBe(false);
  });
});
