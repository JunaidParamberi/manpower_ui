"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { mergeAndValidateProfile } from "@/lib/validations/profile";
import { documentTaxSchema } from "@/lib/validations/document-tax";
import type { ProfileRow } from "@/types";

function normalizeProfileRow(row: {
  id: string;
  full_name: string | null;
  company_name: string | null;
  vat_registered: boolean;
  vat_number: string | null;
  gstin: string | null;
  vat_reg_no: string | null;
  upi_id: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_region: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  default_currency?: string | null;
  default_tax_mode?: string | null;
  default_tax_rate?: number | null;
  default_tds_rate?: number | null;
  brand_kit_id?: string | null;
  onboarding_brand_skipped?: boolean;
  onboarding_completed_at?: string | null;
  plan_tier?: string | null;
  terms_accepted_at?: string | null;
  terms_version?: string | null;
  privacy_accepted_at?: string | null;
  privacy_version?: string | null;
  cookie_analytics?: boolean;
  cookie_marketing?: boolean;
  cookie_updated_at?: string | null;
  created_at: string;
  updated_at: string;
}): ProfileRow {
  return {
    ...row,
    brand_kit_id: row.brand_kit_id ?? null,
    onboarding_brand_skipped: row.onboarding_brand_skipped ?? false,
    onboarding_completed_at: row.onboarding_completed_at ?? null,
    terms_accepted_at: row.terms_accepted_at ?? null,
    terms_version: row.terms_version ?? null,
    privacy_accepted_at: row.privacy_accepted_at ?? null,
    privacy_version: row.privacy_version ?? null,
    cookie_analytics: row.cookie_analytics ?? false,
    cookie_marketing: row.cookie_marketing ?? false,
    cookie_updated_at: row.cookie_updated_at ?? null,
    address_country: row.address_country ? row.address_country.trim().toUpperCase() : null,
    default_currency: row.default_currency ?? "USD",
    default_tax_mode: row.default_tax_mode ?? "none",
    default_tax_rate: row.default_tax_rate ?? 0,
    default_tds_rate: row.default_tds_rate ?? 0,
    plan_tier: (row.plan_tier ?? "free") as "free" | "starter" | "pro" | "agency",
  };
}

export type GetProfileResult =
  | { ok: true; profile: ProfileRow }
  | { ok: true; profile: null; reason: "no_session" | "no_row" }
  | { ok: false; message: string };

const _cachedGetProfile = unstable_cache(
  async (userId: string): Promise<GetProfileResult> => {
    const { supabase } = await getServerContext();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return { ok: false, message: error.message };
    }

    if (!data) {
      return { ok: true, profile: null, reason: "no_row" };
    }

    return { ok: true, profile: normalizeProfileRow(data) };
  },
  ["profile"],
  { revalidate: 300, tags: ["profile"] }
);

/**
 * Loads the authenticated user's profile row (server components & server actions).
 */
export async function getProfile(): Promise<GetProfileResult> {
  const { user } = await getServerContext();
  if (!user) {
    return { ok: true, profile: null, reason: "no_session" };
  }
  return _cachedGetProfile(user.id);
}

export type UpdateProfileResult =
  | { ok: true; profile: ProfileRow }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
      formErrors?: string[];
    };

/**
 * Validates and upserts profile fields for the current user.
 */
export async function updateProfile(patchInput: unknown): Promise<UpdateProfileResult> {
  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const existingResult = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingResult.error) {
    return { ok: false, message: existingResult.error.message };
  }

  const merged = mergeAndValidateProfile(
    existingResult.data ? normalizeProfileRow(existingResult.data) : null,
    patchInput,
  );

  if (!merged.success) {
    const flattened = merged.error.flatten();
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: flattened.fieldErrors,
      formErrors: flattened.formErrors,
    };
  }

  const payload = {
    full_name: merged.data.full_name,
    company_name: merged.data.company_name,
    vat_registered: merged.data.vat_registered,
    vat_number: merged.data.vat_number,
    gstin: merged.data.gstin,
    vat_reg_no: merged.data.vat_reg_no,
    upi_id: merged.data.upi_id,
    default_tds_rate: merged.data.default_tds_rate,
    address_line1: merged.data.address_line1,
    address_line2: merged.data.address_line2,
    address_city: merged.data.address_city,
    address_region: merged.data.address_region,
    address_postal_code: merged.data.address_postal_code,
    address_country: merged.data.address_country,
    default_currency: merged.data.default_currency,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...payload }, { onConflict: "id" })
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Profile could not be saved." };
  }

  revalidateTag("profile");
  return { ok: true, profile: normalizeProfileRow(data) };
}

export async function updateTaxDefaults(rawInput: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = documentTaxSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid tax settings." };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({
      default_tax_mode: parsed.data.tax_mode,
      default_tax_rate: parsed.data.tax_rate,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidateTag("profile");
  return { ok: true };
}
