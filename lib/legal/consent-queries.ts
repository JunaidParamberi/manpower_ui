import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type { ConsentLogRow } from "@/types";

const _cachedListConsentLog = unstable_cache(
  async (userId: string): Promise<ConsentLogRow[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("consent_log")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return [];
    return data as ConsentLogRow[];
  },
  ["list-consent-log"],
  { revalidate: 60, tags: ["legal"] },
);

export async function listConsentLog(): Promise<ConsentLogRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListConsentLog(user.id);
}

export type PrivacyProfileFields = {
  terms_accepted_at: string | null;
  terms_version: string | null;
  privacy_accepted_at: string | null;
  privacy_version: string | null;
  cookie_analytics: boolean;
  cookie_marketing: boolean;
  cookie_updated_at: string | null;
};

const _cachedGetPrivacyProfile = unstable_cache(
  async (userId: string): Promise<PrivacyProfileFields | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, cookie_analytics, cookie_marketing, cookie_updated_at",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as PrivacyProfileFields;
  },
  ["get-privacy-profile"],
  { revalidate: 60, tags: ["legal", "profile"] },
);

export async function getPrivacyProfile(): Promise<PrivacyProfileFields | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  return _cachedGetPrivacyProfile(user.id);
}

export async function needsLegalAcceptance(): Promise<boolean> {
  const profile = await getPrivacyProfile();
  return profile?.terms_accepted_at == null;
}
