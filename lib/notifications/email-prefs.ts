import { NOTIFICATION_EMAIL_CATALOG } from "@/config/notifications";
import {
  NOTIFICATION_EMAIL_EVENT_KEYS,
  type NotificationEmailEventKey,
  type NotificationEmailPrefs,
} from "@/lib/validations/notification-prefs";

export const NOTIFICATION_EMAIL_DEFAULTS = Object.fromEntries(
  NOTIFICATION_EMAIL_CATALOG.map((item) => [item.id, item.defaultEnabled]),
) as Record<NotificationEmailEventKey, boolean>;

export function resolveEmailPrefs(stored: unknown): NotificationEmailPrefs {
  const resolved = { ...NOTIFICATION_EMAIL_DEFAULTS };

  if (stored === null || typeof stored !== "object" || Array.isArray(stored)) {
    return resolved;
  }

  const record = stored as Record<string, unknown>;
  for (const key of NOTIFICATION_EMAIL_EVENT_KEYS) {
    const value = record[key];
    if (typeof value === "boolean") {
      resolved[key] = value;
    }
  }

  return resolved;
}

export function isEmailEnabledForEvent(
  prefs: NotificationEmailPrefs,
  event: NotificationEmailEventKey,
): boolean {
  return prefs[event] ?? NOTIFICATION_EMAIL_DEFAULTS[event];
}

export function toStoredEmailPrefs(
  prefs: NotificationEmailPrefs,
): Record<NotificationEmailEventKey, boolean> {
  return { ...prefs };
}
