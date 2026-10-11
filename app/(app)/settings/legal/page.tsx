import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsentLogSection } from "@/components/features/settings/legal/consent-log-section";
import { CookiePreferencesSection } from "@/components/features/settings/legal/cookie-preferences-section";
import { PoliciesSection } from "@/components/features/settings/legal/policies-section";
import {
  getPrivacyProfile,
  listConsentLog,
} from "@/lib/legal/consent-queries";
import { getServerContext } from "@/lib/supabase/get-server-context";

export const metadata: Metadata = { title: "Legal & privacy" };

export default async function SettingsLegalPage() {
  const { user } = await getServerContext();
  if (!user) redirect("/auth/login");

  const [profile, entries] = await Promise.all([
    getPrivacyProfile(),
    listConsentLog(),
  ]);

  if (!profile) redirect("/auth/login");

  return (
    <div className="flex flex-col gap-8">
      <PoliciesSection profile={profile} />
      <CookiePreferencesSection profile={profile} />
      <ConsentLogSection entries={entries} />
    </div>
  );
}
