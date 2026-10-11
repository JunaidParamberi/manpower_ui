"use server";

import { revalidateTag } from "next/cache";

import { toStoredEmailPrefs } from "@/lib/notifications/email-prefs";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { updateNotificationEmailPrefsSchema } from "@/lib/validations/notification-prefs";

export type NotificationPrefsActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateNotificationEmailPrefs(input: {
  prefs: Record<string, boolean>;
}): Promise<NotificationPrefsActionResult> {
  const parsed = updateNotificationEmailPrefsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid notification preferences." };
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const now = new Date().toISOString();
  const stored = toStoredEmailPrefs(parsed.data.prefs);

  const { error } = await supabase
    .from("profiles")
    .update({
      notification_email_prefs: stored,
      notification_email_updated_at: now,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateTag("notifications-prefs");
  revalidateTag("profile");

  return { ok: true };
}
