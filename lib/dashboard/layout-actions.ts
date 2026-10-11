"use server";

import { revalidateTag } from "next/cache";

import { getServerContext } from "@/lib/supabase/get-server-context";
import { mergeDashboardLayout } from "@/lib/dashboard/layout-registry";

export type UpdateDashboardLayoutResult = { ok: true } | { ok: false; message: string };

/**
 * Persists the user's dashboard card order/visibility. Input is reconciled
 * against the live card registry before writing, so a stale client can't
 * write back an id that no longer exists.
 */
export async function updateDashboardLayout(
  order: string[],
  hidden: string[],
): Promise<UpdateDashboardLayoutResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, message: "Not authenticated" };

  const merged = mergeDashboardLayout(order, hidden);

  const { error } = await supabase.from("dashboard_layouts").upsert({
    user_id: user.id,
    card_order: merged.order,
    hidden_cards: merged.hidden,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, message: error.message };

  revalidateTag("dashboard-layout");
  return { ok: true };
}
