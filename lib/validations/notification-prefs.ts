import { z } from "zod";

export const NOTIFICATION_EMAIL_EVENT_KEYS = [
  "invoice_paid",
  "invoice_overdue",
  "quote_approved",
  "quote_declined",
  "proposal_approved",
  "doc_sent",
  "task_due",
] as const;

export type NotificationEmailEventKey =
  (typeof NOTIFICATION_EMAIL_EVENT_KEYS)[number];

export const notificationEmailPrefsSchema = z.object({
  invoice_paid: z.boolean(),
  invoice_overdue: z.boolean(),
  quote_approved: z.boolean(),
  quote_declined: z.boolean(),
  proposal_approved: z.boolean(),
  doc_sent: z.boolean(),
  task_due: z.boolean(),
});

export type NotificationEmailPrefs = z.infer<
  typeof notificationEmailPrefsSchema
>;

export const updateNotificationEmailPrefsSchema = z.object({
  prefs: notificationEmailPrefsSchema,
});

export type UpdateNotificationEmailPrefsInput = z.infer<
  typeof updateNotificationEmailPrefsSchema
>;

export function isNotificationEmailEventKey(
  value: string,
): value is NotificationEmailEventKey {
  return (NOTIFICATION_EMAIL_EVENT_KEYS as readonly string[]).includes(value);
}
