"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { BRAND_LOGO_ALLOWED_MIME, brandKitFormSchema } from "@/lib/validations/brand-kit";
import type { BrandKitRow } from "@/types";
import { extractLogoStoragePath } from "./utils";

const LOGO_MAX_BYTES = 5 * 1024 * 1024;

function normalizeBrandKitRow(row: {
  id: string;
  user_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font: string;
  email_signature: string | null;
  created_at: string;
  updated_at: string;
}): BrandKitRow {
  return {
    ...row,
    primary_color: row.primary_color.trim().toLowerCase(),
    secondary_color: row.secondary_color.trim().toLowerCase(),
    font: row.font.trim(),
  };
}

function extFromMime(mime: string): string | null {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/svg+xml": "svg",
  };
  return map[mime] ?? null;
}

export type GetBrandKitResult =
  | { ok: true; brandKit: BrandKitRow }
  | { ok: true; brandKit: null; reason: "no_session" | "no_row" }
  | { ok: false; message: string };

export async function getBrandKit(): Promise<GetBrandKitResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: true, brandKit: null, reason: "no_session" };
  }

  const { data, error } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: true, brandKit: null, reason: "no_row" };
  }

  return { ok: true, brandKit: normalizeBrandKitRow(data) };
}

export type SaveBrandKitResult =
  | { ok: true; brandKit: BrandKitRow }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
      formErrors?: string[];
    };

/**
 * Validates text fields, optionally uploads logo to `brand-logos`, upserts `brand_kits`, sets `profiles.brand_kit_id`.
 */
export async function saveBrandKit(formData: FormData): Promise<SaveBrandKitResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const raw = {
    primary_color: formData.get("primary_color"),
    secondary_color: formData.get("secondary_color"),
    font: formData.get("font"),
    email_signature: formData.get("email_signature"),
  };

  const parsed = brandKitFormSchema.safeParse(raw);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: flattened.fieldErrors,
      formErrors: flattened.formErrors,
    };
  }

  let logoUrlToSet: string | undefined;
  const logoEntry = formData.get("logo");
  if (logoEntry instanceof File && logoEntry.size > 0) {
    const mime = logoEntry.type;
    if (
      !BRAND_LOGO_ALLOWED_MIME.some(
        (allowed) => allowed === mime,
      )
    ) {
      return {
        ok: false,
        message: "Logo must be PNG, JPEG, WebP, GIF, or SVG.",
      };
    }
    if (logoEntry.size > LOGO_MAX_BYTES) {
      return { ok: false, message: "Logo must be 5 MB or smaller." };
    }
    const ext = extFromMime(logoEntry.type);
    if (!ext) {
      return { ok: false, message: "Unsupported image type." };
    }

    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("brand-logos").upload(path, logoEntry, {
      contentType: logoEntry.type,
      upsert: false,
    });

    if (uploadError) {
      return { ok: false, message: uploadError.message };
    }

    const { data: pub } = supabase.storage.from("brand-logos").getPublicUrl(path);
    logoUrlToSet = pub.publicUrl;
  }

  const sig = parsed.data.email_signature.trim();
  const payload: Record<string, unknown> = {
    primary_color: parsed.data.primary_color,
    secondary_color: parsed.data.secondary_color,
    font: parsed.data.font,
    email_signature: sig === "" ? null : sig,
  };

  if (logoUrlToSet !== undefined) {
    payload.logo_url = logoUrlToSet;
  }

  const existing = await supabase
    .from("brand_kits")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing.error) {
    return { ok: false, message: existing.error.message };
  }

  if (existing.data) {
    const oldLogoUrl = existing.data.logo_url;

    const { data, error } = await supabase
      .from("brand_kits")
      .update(payload)
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

    if (error) {
      return { ok: false, message: error.message };
    }
    if (!data) {
      return { ok: false, message: "Brand kit could not be saved." };
    }

    if (logoUrlToSet && oldLogoUrl) {
      const oldPath = extractLogoStoragePath(oldLogoUrl);
      if (oldPath) {
        await supabase.storage.from("brand-logos").remove([oldPath]);
      }
    }

    revalidatePath("/settings/brand");
    revalidatePath("/onboarding/brand");
    revalidateTag("profile");
    return { ok: true, brandKit: normalizeBrandKitRow(data) };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("brand_kits")
    .insert({
      user_id: user.id,
      ...payload,
    })
    .select("*")
    .maybeSingle();

  if (insertError) {
    return { ok: false, message: insertError.message };
  }
  if (!inserted) {
    return { ok: false, message: "Brand kit could not be created." };
  }

  const { error: profileLinkError } = await supabase
    .from("profiles")
    .update({ brand_kit_id: inserted.id })
    .eq("id", user.id);

  if (profileLinkError) {
    return { ok: false, message: profileLinkError.message };
  }

  revalidatePath("/settings/brand");
  revalidatePath("/onboarding/brand");
  return { ok: true, brandKit: normalizeBrandKitRow(inserted) };
}
