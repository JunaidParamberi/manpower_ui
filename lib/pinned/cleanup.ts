import { revalidateTag } from "next/cache";

import type { createClient as createSupabaseClient } from "@/lib/supabase/server";

export type PinnedItemType = "project" | "client" | "document" | "task";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseClient>>;

export async function removePinnedItemForDeletedTarget({
  supabase,
  userId,
  itemType,
  itemId,
}: {
  supabase: SupabaseServerClient;
  userId: string;
  itemType: PinnedItemType;
  itemId: string;
}) {
  const { error } = await supabase
    .from("pinned_items")
    .delete()
    .eq("user_id", userId)
    .eq("item_type", itemType)
    .eq("item_id", itemId);

  if (!error) {
    revalidateTag("pinned");
  }
}
