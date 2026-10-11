import type { StoredCookieConsent } from "@/lib/validations/legal";

export type ProfileCookieFields = {
  cookie_analytics: boolean;
  cookie_marketing: boolean;
  cookie_updated_at: string | null;
};

export type ProfileCookieUpdate = {
  cookie_analytics: boolean;
  cookie_marketing: boolean;
  cookie_updated_at: string;
};

export function toProfileCookieUpdate(
  prefs: Pick<StoredCookieConsent, "analytics" | "marketing">,
  now: Date = new Date(),
): ProfileCookieUpdate {
  return {
    cookie_analytics: prefs.analytics,
    cookie_marketing: prefs.marketing,
    cookie_updated_at: now.toISOString(),
  };
}

export function parseStoredConsent(raw: unknown): StoredCookieConsent | null {
  if (raw === null || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  if (
    typeof record.analytics !== "boolean" ||
    typeof record.marketing !== "boolean" ||
    typeof record.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    analytics: record.analytics,
    marketing: record.marketing,
    updatedAt: record.updatedAt,
  };
}

export function needsAnonymousSync(
  stored: StoredCookieConsent,
  profile: ProfileCookieFields,
): boolean {
  if (!profile.cookie_updated_at) return true;

  const profileTime = new Date(profile.cookie_updated_at).getTime();
  const storedTime = new Date(stored.updatedAt).getTime();

  if (Number.isNaN(profileTime) || Number.isNaN(storedTime)) {
    return true;
  }

  return storedTime > profileTime;
}

export function hasCookieConsent(
  profile: ProfileCookieFields | null,
  stored: StoredCookieConsent | null,
): boolean {
  if (profile?.cookie_updated_at) return true;
  return stored !== null;
}

export function cookiePrefsToMetadata(prefs: {
  analytics: boolean;
  marketing: boolean;
}): Record<string, boolean> {
  return {
    analytics: prefs.analytics,
    marketing: prefs.marketing,
  };
}
