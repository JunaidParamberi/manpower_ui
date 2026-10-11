"use server";

import { revalidateTag } from "next/cache";

import { legalConfig } from "@/config/legal";
import { buildConsentLogRow } from "@/lib/legal/consent-log";
import {
  cookiePrefsToMetadata,
  needsAnonymousSync,
  toProfileCookieUpdate,
} from "@/lib/legal/cookie-prefs";
import { getServerContext } from "@/lib/supabase/get-server-context";
import {
  cookiePreferencesSchema,
  syncAnonymousConsentSchema,
} from "@/lib/validations/legal";

export type LegalActionResult =
  | { ok: true }
  | { ok: false; message: string };

async function insertConsentRows(
  userId: string,
  rows: ReturnType<typeof buildConsentLogRow>[],
): Promise<LegalActionResult> {
  const { supabase } = await getServerContext();
  const { error } = await supabase.from("consent_log").insert(rows);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function recordTermsAndPrivacyAcceptance(): Promise<LegalActionResult> {
  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const now = new Date().toISOString();
  const version = legalConfig.policyVersion;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      terms_accepted_at: now,
      terms_version: version,
      privacy_accepted_at: now,
      privacy_version: version,
    })
    .eq("id", user.id);

  if (profileError) {
    return { ok: false, message: profileError.message };
  }

  const logResult = await insertConsentRows(user.id, [
    buildConsentLogRow({
      userId: user.id,
      consentType: "terms",
      action: "accepted",
      policyVersion: version,
    }),
    buildConsentLogRow({
      userId: user.id,
      consentType: "privacy",
      action: "accepted",
      policyVersion: version,
    }),
  ]);

  if (!logResult.ok) {
    return logResult;
  }

  revalidateTag("legal");
  revalidateTag("profile");

  return { ok: true };
}

export async function updateCookiePreferences(input: {
  analytics: boolean;
  marketing: boolean;
}): Promise<LegalActionResult> {
  const parsed = cookiePreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid cookie preferences." };
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const update = toProfileCookieUpdate(parsed.data);

  const { error: profileError } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (profileError) {
    return { ok: false, message: profileError.message };
  }

  const logResult = await insertConsentRows(user.id, [
    buildConsentLogRow({
      userId: user.id,
      consentType: "cookies",
      action: "updated",
      policyVersion: legalConfig.policyVersion,
      metadata: cookiePrefsToMetadata(parsed.data),
    }),
  ]);

  if (!logResult.ok) {
    return logResult;
  }

  revalidateTag("legal");
  revalidateTag("profile");

  return { ok: true };
}

export async function syncAnonymousConsent(input: {
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
}): Promise<LegalActionResult> {
  const parsed = syncAnonymousConsentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid consent payload." };
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("cookie_analytics, cookie_marketing, cookie_updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    return { ok: false, message: readError.message };
  }

  if (!profile) {
    return { ok: false, message: "Profile not found." };
  }

  const stored = {
    analytics: parsed.data.analytics,
    marketing: parsed.data.marketing,
    updatedAt: parsed.data.updatedAt,
  };

  if (!needsAnonymousSync(stored, profile)) {
    return { ok: true };
  }

  return updateCookiePreferences({
    analytics: parsed.data.analytics,
    marketing: parsed.data.marketing,
  });
}
