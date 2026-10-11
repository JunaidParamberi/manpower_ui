// lib/dashboard/dismissal-actions.ts
"use server";

import { revalidateTag } from "next/cache";

import { getServerContext } from "@/lib/supabase/get-server-context";
import { snoozeInputSchema, type SnoozeDuration } from "@/lib/dashboard/dismissals";

const dismissInputSchema = snoozeInputSchema.omit({ until: true });

function snoozedUntilIso(duration: SnoozeDuration): string | null {
  if (duration === "until_change") return null;
  const days = duration === "tomorrow" ? 1 : 7;
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export async function snoozeQueueItem(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = snoozeInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid snooze request." };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { error } = await supabase.from("dashboard_dismissals").upsert(
    {
      user_id: user.id,
      item_type: parsed.data.itemType,
      item_id: parsed.data.itemId,
      snoozed_until: snoozedUntilIso(parsed.data.until),
      dismissed_at: null,
    },
    { onConflict: "user_id,item_type,item_id" },
  );
  if (error) return { ok: false, error: error.message };

  revalidateTag("dashboard");
  return { ok: true };
}

export async function dismissQueueItem(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = dismissInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid dismiss request." };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { error } = await supabase.from("dashboard_dismissals").upsert(
    {
      user_id: user.id,
      item_type: parsed.data.itemType,
      item_id: parsed.data.itemId,
      snoozed_until: null,
      dismissed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,item_type,item_id" },
  );
  if (error) return { ok: false, error: error.message };

  revalidateTag("dashboard");
  return { ok: true };
}

/** Powers the Undo in the toast: deleting the row restores the item. */
export async function undoQueueDismissal(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = dismissInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid undo request." };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { error } = await supabase
    .from("dashboard_dismissals")
    .delete()
    .eq("user_id", user.id)
    .eq("item_type", parsed.data.itemType)
    .eq("item_id", parsed.data.itemId);
  if (error) return { ok: false, error: error.message };

  revalidateTag("dashboard");
  return { ok: true };
}