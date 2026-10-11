import { unstable_cache } from "next/cache";

import { getServerContext } from "@/lib/supabase/get-server-context";

export type PinnedItem = {
  id: string;
  item_type: "project" | "client" | "document" | "task";
  item_id: string;
  item_label: string;
  item_href: string;
  position: number;
};

const _cachedPinnedItems = unstable_cache(
  async (userId: string) => {
    const { supabase } = await getServerContext();
    const { data } = await supabase
      .from("pinned_items")
      .select("id, item_type, item_id, item_label, item_href, position")
      .eq("user_id", userId)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    return (data ?? []) as PinnedItem[];
  },
  ["pinned-items"],
  { tags: ["pinned"], revalidate: 60 },
);

export async function getPinnedItems(): Promise<PinnedItem[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedPinnedItems(user.id);
}
