import { unstable_cache } from "next/cache";

import {
  NOTIFICATION_EMAIL_DEFAULTS,
  resolveEmailPrefs,
} from "@/lib/notifications/email-prefs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type { NotificationEmailPrefs } from "@/lib/validations/notification-prefs";

export type NotificationEmailPrefsProfile = {
  prefs: NotificationEmailPrefs;
  notification_email_updated_at: string | null;
};

function defaultNotificationEmailPrefsProfile(): NotificationEmailPrefsProfile {
  return {
    prefs: { ...NOTIFICATION_EMAIL_DEFAULTS },
    notification_email_updated_at: null,
  };
}

const _cachedGetNotificationEmailPrefs = unstable_cache(
  async (userId: string): Promise<NotificationEmailPrefsProfile> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("notification_email_prefs, notification_email_updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[getNotificationEmailPrefs]", error.message);
      return defaultNotificationEmailPrefsProfile();
    }

    if (!data) {
      return defaultNotificationEmailPrefsProfile();
    }

    return {
      prefs: resolveEmailPrefs(data.notification_email_prefs),
      notification_email_updated_at: data.notification_email_updated_at,
    };
  },
  ["get-notification-email-prefs"],
  { revalidate: 60, tags: ["notifications-prefs", "profile"] },
);

export async function getNotificationEmailPrefs(): Promise<NotificationEmailPrefsProfile | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  return _cachedGetNotificationEmailPrefs(user.id);
}

export async function getNotificationEmailPrefsForUser(
  userId: string,
): Promise<NotificationEmailPrefsProfile> {
  return _cachedGetNotificationEmailPrefs(userId);
}
