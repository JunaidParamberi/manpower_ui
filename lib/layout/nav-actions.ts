"use server";

import { revalidateTag } from "next/cache";

import { getServerContext } from "@/lib/supabase/get-server-context";
import { mergeNavLayout } from "@/lib/layout/nav-registry";

export type UpdateNavLayoutResult = { ok: true } | { ok: false; message: string };

/**
 * Persists the user's sidebar nav order/visibility. Input is reconciled
 * against the live nav registry before writing, so a stale client can't
 * write back an id that no longer exists.
 */
export async function updateNavLayout(
  order: string[],
  hidden: string[],
): Promise<UpdateNavLayoutResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, message: "Not authenticated" };

  const merged = mergeNavLayout(order, hidden);

  const { error } = await supabase.from("nav_layouts").upsert({
    user_id: user.id,
    item_order: merged.order,
    hidden_items: merged.hidden,
    updated_at: new Date().toISOString(),
  });

  if (error) return { ok: false, message: error.message };

  revalidateTag("nav-layout");
  return { ok: true };
}
