"use server";

import { unstable_cache } from "next/cache";

import { getServerContext } from "@/lib/supabase/get-server-context";
import { mergeNavLayout, type NavLayout } from "@/lib/layout/nav-registry";

const _cachedGetNavLayout = unstable_cache(
  async (userId: string): Promise<{ order: string[]; hidden: string[] }> => {
    const { supabase } = await getServerContext();
    const { data } = await supabase
      .from("nav_layouts")
      .select("item_order, hidden_items")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      order: data?.item_order ?? [],
      hidden: data?.hidden_items ?? [],
    };
  },
  ["nav-layout"],
  { revalidate: 60, tags: ["nav-layout"] },
);

/**
 * Loads the current user's sidebar nav order/visibility, reconciled
 * against the live nav registry (see `nav-registry.ts`).
 */
export async function getNavLayout(): Promise<NavLayout> {
  const { user } = await getServerContext();
  if (!user) return mergeNavLayout([], []);
  const stored = await _cachedGetNavLayout(user.id);
  return mergeNavLayout(stored.order, stored.hidden);
}
