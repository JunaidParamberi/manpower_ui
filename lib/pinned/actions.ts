"use server";

import { revalidateTag } from "next/cache";

import { getServerContext } from "@/lib/supabase/get-server-context";

type PinItemInput = {
  itemType: "project" | "client" | "document" | "task";
  itemId: string;
  itemLabel: string;
  itemHref: string;
};

export async function pinItem(input: PinItemInput) {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false };

  const { error } = await supabase.from("pinned_items").upsert(
    {
      user_id: user.id,
      item_type: input.itemType,
      item_id: input.itemId,
      item_label: input.itemLabel,
      item_href: input.itemHref,
    },
    { onConflict: "user_id,item_type,item_id" },
  );

  if (error) return { ok: false, error: error.message };
  revalidateTag("pinned");
  return { ok: true };
}

export async function unpinItem(itemType: string, itemId: string) {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("pinned_items")
    .delete()
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq("item_id", itemId);

  if (error) return { ok: false, error: error.message };
  revalidateTag("pinned");
  return { ok: true };
}
