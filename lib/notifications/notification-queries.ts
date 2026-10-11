"use server";

import { unstable_cache } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type { NotificationRow, NotificationType } from "@/types";

import { normalizeNotificationPayload } from "./notification-utils";

const NOTIFICATION_TYPES: NotificationType[] = [
  "invoice_paid",
  "quote_approved",
  "quote_declined",
  "proposal_approved",
  "doc_sent",
  "daily_digest",
  "client_health_drop",
];

function mapRow(row: {
  id: string;
  user_id: string;
  type: string;
  payload: unknown;
  read_at: string | null;
  action_taken_at: string | null;
  created_at: string;
  updated_at: string;
}): NotificationRow | null {
  const payload = normalizeNotificationPayload(row.payload);
  if (!payload) return null;
  if (!NOTIFICATION_TYPES.includes(row.type as NotificationType)) {
    return null;
  }
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as NotificationType,
    payload,
    read_at: row.read_at,
    action_taken_at: row.action_taken_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

const _cachedListNotificationsForUser = unstable_cache(
  async (userId: string, limit: number): Promise<NotificationRow[]> => {
    const { supabase } = await getServerContext();

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, user_id, type, payload, read_at, action_taken_at, created_at, updated_at"
      )
      .eq("user_id", userId)
      .in("type", NOTIFICATION_TYPES)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[listNotificationsForUser]", error.message);
      return [];
    }

    return (data ?? [])
      .map(mapRow)
      .filter((r): r is NotificationRow => r !== null);
  },
  ["notifications-list"],
  { revalidate: 30, tags: ["notifications"] }
);

export async function listNotificationsForUser(
  limit = 50
): Promise<NotificationRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListNotificationsForUser(user.id, limit);
}

const _cachedGetUnreadNotificationCount = unstable_cache(
  async (userId: string): Promise<number> => {
    const { supabase } = await getServerContext();

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null)
      .in("type", NOTIFICATION_TYPES);

    if (error) {
      console.error("[getUnreadNotificationCount]", error.message);
      return 0;
    }

    return count ?? 0;
  },
  ["notifications-count"],
  { revalidate: 30, tags: ["notifications"] }
);

export async function getUnreadNotificationCount(): Promise<number> {
  const { user } = await getServerContext();
  if (!user) return 0;
  return _cachedGetUnreadNotificationCount(user.id);
}
