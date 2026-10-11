"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { getServerContext } from "@/lib/supabase/get-server-context";
import { upgradePlanSchema } from "@/lib/validations/billing";
import type { PlanTier } from "@/config/plans";

type CheckoutResult =
  | { ok: true; url: string | null }
  | { ok: false; error: string };

/**
 * Mock checkout: validates the requested plan and applies it straight to the
 * local mock DB (subscriptions row + profile plan tier) instead of creating a
 * Lemon Squeezy checkout. Always returns `url: null`, so the caller stays on
 * the page and flips into the "switching plans" state.
 */
export async function createCheckoutUrl(
  input: unknown,
): Promise<CheckoutResult> {
  const parsed = upgradePlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid plan" };

  const plan = parsed.data.plan as Exclude<PlanTier, "free">;

  const { user, supabase } = await getServerContext();
  if (!user) return { ok: false, error: "Not authenticated" };

  console.log(
    `[mock-billing] checkout for user ${user.id} → plan "${plan}" (mock, no LemonSqueezy call)`,
  );

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, plan, status")
    .eq("user_id", user.id)
    .maybeSingle();

  const now = new Date().toISOString();

  if (existing) {
    const { error } = await supabase
      .from("subscriptions")
      .update({ plan, status: "active", updated_at: now })
      .eq("id", existing.id)
      .eq("user_id", user.id);
    if (error) console.log(`[mock-billing] subscription update failed: ${error.message}`);
  } else {
    const { error } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      plan,
      status: "active",
      created_at: now,
      updated_at: now,
    });
    if (error) console.log(`[mock-billing] subscription insert failed: ${error.message}`);
  }

  // Mirror the webhook's side effect: the profile tier gates the rest of the app.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ plan_tier: plan })
    .eq("id", user.id);
  if (profileError) console.log(`[mock-billing] profile update failed: ${profileError.message}`);

  revalidateTag("subscription");
  revalidatePath("/settings/billing");
  return { ok: true, url: null };
}

/**
 * Mock billing portal: returns the portal URL stored on the mock subscriptions
 * row, falling back to the local billing page so the caller always has a
 * same-origin URL to open. No network call.
 */
export async function manageBillingUrl(): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  const { user, supabase } = await getServerContext();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data } = await supabase
    .from("subscriptions")
    .select("customer_portal_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const url = data?.customer_portal_url ?? "/settings/billing";
  console.log(`[mock-billing] manage billing portal → ${url} (mock, no LemonSqueezy call)`);

  return { ok: true, url };
}
