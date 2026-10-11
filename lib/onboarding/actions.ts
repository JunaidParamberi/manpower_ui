"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type OnboardingActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function skipBrandOnboarding(): Promise<OnboardingActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_brand_skipped: true })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateTag("profile");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function completeOnboarding(): Promise<OnboardingActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateTag("profile");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
