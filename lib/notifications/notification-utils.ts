import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";

import type { NotificationRow } from "@/types";

export type NotificationTimeGroup = "today" | "yesterday" | "earlier";

/**
 * Reads a stored payload into the current shape.
 *
 * Rows written before the title/body split carry a single `label`; those fold
 * into `title` here so the rest of the app only ever sees `title` / `body`.
 * A row missing both is unrenderable and returns null — the query layer drops
 * it rather than showing an empty line.
 */
export function normalizeNotificationPayload(
  raw: unknown
): NotificationRow["payload"] | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.href !== "string" || typeof p.entity_id !== "string") {
    return null;
  }

  const title =
    typeof p.title === "string" && p.title.trim() !== ""
      ? p.title
      : typeof p.label === "string" && p.label.trim() !== ""
        ? p.label
        : null;
  if (title === null) return null;

  const body =
    typeof p.body === "string" && p.body.trim() !== "" ? p.body : undefined;

  return { href: p.href, entity_id: p.entity_id, title, ...(body ? { body } : {}) };
}

export function partitionNotifications(notifications: NotificationRow[]): {
  unread: NotificationRow[];
  read: NotificationRow[];
} {
  const unread: NotificationRow[] = [];
  const read: NotificationRow[] = [];
  for (const n of notifications) {
    if (n.read_at === null) unread.push(n);
    else read.push(n);
  }
  return { unread, read };
}

export function notificationTimeGroup(
  createdAt: string,
  now = new Date()
): NotificationTimeGroup {
  const date = startOfDay(parseISO(createdAt));
  const ref = startOfDay(now);
  const diffDays = differenceInCalendarDays(ref, date);
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return "earlier";
}

export function groupNotificationsByTime(
  items: NotificationRow[],
  now = new Date()
): { group: NotificationTimeGroup; items: NotificationRow[] }[] {
  const buckets: Record<NotificationTimeGroup, NotificationRow[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };
  const sorted = [...items].sort(
    (a, b) => parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
  );
  for (const item of sorted) {
    buckets[notificationTimeGroup(item.created_at, now)].push(item);
  }
  const order: NotificationTimeGroup[] = ["today", "yesterday", "earlier"];
  return order
    .filter((g) => buckets[g].length > 0)
    .map((group) => ({ group, items: buckets[group] }));
}

export const TIME_GROUP_LABELS: Record<NotificationTimeGroup, string> = {
  today: "Today",
  yesterday: "Yesterday",
  earlier: "Earlier",
};

export function formatNotificationBadgeCount(count: number): string | null {
  if (count <= 0) return null;
  if (count >= 10) return "9+";
  return String(count);
}

export function isUnread(notification: NotificationRow): boolean {
  return notification.read_at === null;
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Compact timestamp for the notification list.
 *
 * date-fns' `formatDistanceToNow` reads "about 14 hours ago" — the hedge is
 * noise in a dense list where every row carries one. The activity feed keeps
 * the longer form; its rows are airier and further apart.
 */
export function formatNotificationTimestamp(
  date: Date | string,
  now = new Date(),
): string {
  const d = date instanceof Date ? date : new Date(date);
  const elapsed = now.getTime() - d.getTime();

  if (elapsed < MINUTE_MS) return "Just now";
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m ago`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h ago`;

  const days = Math.floor(elapsed / DAY_MS);
  if (days <= 7) return `${days}d ago`;
  return format(d, "MMM d");
}
