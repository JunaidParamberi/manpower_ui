import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EmailPreferencesSection } from "@/components/features/settings/notifications/email-preferences-section";
import { NOTIFICATION_EMAIL_DEFAULTS } from "@/lib/notifications/email-prefs";
import { getNotificationEmailPrefs } from "@/lib/notifications/prefs-queries";
import { getServerContext } from "@/lib/supabase/get-server-context";

export const metadata: Metadata = { title: "Notifications" };

export default async function SettingsNotificationsPage() {
  const { user } = await getServerContext();
  if (!user) redirect("/auth/login");

  const profile = (await getNotificationEmailPrefs()) ?? {
    prefs: { ...NOTIFICATION_EMAIL_DEFAULTS },
    notification_email_updated_at: null,
  };

  return (
    <div className="flex flex-col gap-8">
      <EmailPreferencesSection profile={profile} />
    </div>
  );
}
