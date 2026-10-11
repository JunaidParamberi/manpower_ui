import type { SupabaseClient } from "@supabase/supabase-js";

import type { NotificationPayload, NotificationType } from "@/types";

type InsertParams = {
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
};

/**
 * Idempotent insert (unique on user_id + type + entity_id).
 * Uses service-role or user-scoped client; RLS applies for authenticated clients.
 */
export async function createNotification(
  supabase: SupabaseClient,
  { userId, type, payload }: InsertParams
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    payload,
  });

  if (error && error.code !== "23505") {
    console.error("[createNotification]", type, error.message);
  }
}
