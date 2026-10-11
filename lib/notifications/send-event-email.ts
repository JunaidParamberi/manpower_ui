import type { SupabaseClient } from "@supabase/supabase-js";

import { NOTIFICATION_EMAIL_CATALOG } from "@/config/notifications";
import { sendDocumentEventEmail } from "@/lib/email/send-user-transactional";
import {
  isEmailEnabledForEvent,
  resolveEmailPrefs,
} from "@/lib/notifications/email-prefs";
import type { DocumentNotificationSource } from "@/lib/notifications/build-payload";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationType } from "@/types";
import type { NotificationEmailEventKey } from "@/lib/validations/notification-prefs";

type DocumentEventEmailType =
  | "invoice_paid"
  | "quote_approved"
  | "quote_declined"
  | "proposal_approved"
  | "doc_sent";

const NOTIFICATION_TO_EMAIL_EVENT: Partial<
  Record<NotificationType, DocumentEventEmailType>
> = {
  invoice_paid: "invoice_paid",
  quote_approved: "quote_approved",
  quote_declined: "quote_declined",
  proposal_approved: "proposal_approved",
  doc_sent: "doc_sent",
};

const EMAIL_SUPPORTED_EVENTS = new Set(
  NOTIFICATION_EMAIL_CATALOG.filter((item) => item.emailSupported).map(
    (item) => item.id,
  ),
);

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function docNumber(doc: DocumentNotificationSource): string {
  if (doc.type === "invoice" && doc.invoice_number) return doc.invoice_number;
  if (doc.type === "quote" && doc.quote_number) return doc.quote_number;
  if (doc.type === "proposal" && doc.proposal_number) return doc.proposal_number;
  return doc.title;
}

function toEmailEventKey(
  type: NotificationType,
): NotificationEmailEventKey | null {
  const mapped = NOTIFICATION_TO_EMAIL_EVENT[type];
  if (!mapped) return null;
  return mapped;
}

export async function maybeSendNotificationEmail(
  _supabase: SupabaseClient,
  userId: string,
  type: NotificationType,
  doc: DocumentNotificationSource & { currency?: string | null },
): Promise<void> {
  const emailEventKey = toEmailEventKey(type);
  if (!emailEventKey || !EMAIL_SUPPORTED_EVENTS.has(emailEventKey)) {
    return;
  }

  const admin = createAdminClient();
  const [{ data: profile }, { data: authUser }] = await Promise.all([
    admin
      .from("profiles")
      .select("notification_email_prefs")
      .eq("id", userId)
      .maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);

  const prefs = resolveEmailPrefs(profile?.notification_email_prefs);
  if (!isEmailEnabledForEvent(prefs, emailEventKey)) {
    return;
  }

  const to = authUser.user?.email;
  if (!to) {
    console.error("[maybeSendNotificationEmail] missing user email", userId);
    return;
  }

  const emailEvent = NOTIFICATION_TO_EMAIL_EVENT[type];
  if (!emailEvent) return;

  const result = await sendDocumentEventEmail({
    to,
    event: emailEvent,
    documentNumber: docNumber(doc),
    clientName: doc.clientName ?? "Client",
    documentUrl: `${appUrl()}/documents/${doc.id}`,
    amount: type === "invoice_paid" ? (doc.amount ?? null) : null,
    currency: doc.currency ?? undefined,
  });

  if (!result.ok) {
    console.error(
      "[maybeSendNotificationEmail]",
      type,
      result.error ?? "send failed",
    );
  }
}
