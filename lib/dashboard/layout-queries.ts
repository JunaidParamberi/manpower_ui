"use server";

import { unstable_cache } from "next/cache";

import { getServerContext } from "@/lib/supabase/get-server-context";
import { mergeDashboardLayout, type DashboardLayout } from "@/lib/dashboard/layout-registry";

const _cachedGetDashboardLayout = unstable_cache(
  async (userId: string): Promise<{ order: string[]; hidden: string[] }> => {
    const { supabase } = await getServerContext();
    const { data } = await supabase
      .from("dashboard_layouts")
      .select("card_order, hidden_cards")
      .eq("user_id", userId)
      .maybeSingle();
    return {
      order: data?.card_order ?? [],
      hidden: data?.hidden_cards ?? [],
    };
  },
  ["dashboard-layout"],
  { revalidate: 60, tags: ["dashboard-layout"] },
);

/**
 * Loads the current user's dashboard card order/visibility, reconciled
 * against the live card registry (see `layout-registry.ts`).
 */
export async function getDashboardLayout(): Promise<DashboardLayout> {
  const { user } = await getServerContext();
  if (!user) return mergeDashboardLayout([], []);
  const stored = await _cachedGetDashboardLayout(user.id);
  return mergeDashboardLayout(stored.order, stored.hidden);
}
