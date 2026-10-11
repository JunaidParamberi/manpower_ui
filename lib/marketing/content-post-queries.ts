import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { pickEmbed } from "@/lib/supabase/pick-embed";
import type { ContentPostInput, PostStatus } from "@/lib/validations/content-post";

export type MediaItem = ContentPostInput["media"][number];

export type ContentPostRow = {
  id: string;
  title: string;
  platform: string;
  caption: string;
  hashtags: string[];
  media: MediaItem[];
  status: PostStatus;
  scheduledAt: Date | string | null;
  clientId: string | null;
  clientName: string | null;
  campaignId: string | null;
};

const CONTENT_POST_SELECT = "*, clients(id, name)" as const;

type ContentPostRowRaw = {
  id: string;
  title: string;
  platform: string;
  caption: string;
  hashtags: string[] | null;
  media: unknown;
  status: string;
  scheduled_at: string | null;
  client_id: string | null;
  campaign_id: string | null;
  clients?: unknown;
};

function normalizeContentPostRow(row: ContentPostRowRaw): ContentPostRow {
  const clientEmbed = pickEmbed(row.clients, "name");
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    caption: row.caption,
    hashtags: Array.isArray(row.hashtags) ? row.hashtags : [],
    media: Array.isArray(row.media) ? (row.media as MediaItem[]) : [],
    status: row.status as PostStatus,
    scheduledAt: row.scheduled_at,
    clientId: row.client_id,
    clientName: clientEmbed ? clientEmbed.name : null,
    campaignId: row.campaign_id,
  };
}

/**
 * Computes [start, end) as UTC month boundaries for a "YYYY-MM" string,
 * widened by a full calendar day on each side.
 *
 * This query runs server-side with no access to the browser's timezone, but
 * display-side bucketing (`groupPostsByDay` / `bucketEventsByDay`) buckets
 * by the client's *local* day. A post scheduled near a local month boundary
 * (e.g. local July 1st 00:30 in UTC+4 is June 30th 20:30 UTC) would fall
 * outside a tight UTC-bounded window and never be fetched for the month the
 * user actually placed it in. Widening by ±1 day covers every real-world
 * UTC offset (up to ±14h); the already-fixed local-time bucketing then
 * correctly places (or excludes) each fetched post once it's in hand — the
 * standard "fetch generously server-side, bucket precisely client-side"
 * pattern.
 */
function monthRange(month: string): { start: string; end: string } {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Same ±1-day widening as monthRange, around a 7-day window. See monthRange's
 * comment for why the widening is necessary: the window is computed in UTC but
 * bucketed locally on the client.
 */
function weekRange(weekAnchor: string): { start: string; end: string } {
  const [year, month, day] = weekAnchor.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day - 1));
  const end = new Date(Date.UTC(year, month - 1, day + 8));
  return { start: start.toISOString(), end: end.toISOString() };
}

const _cachedPostsInRange = unstable_cache(
  async (
    userId: string,
    startIso: string,
    endIso: string,
  ): Promise<ContentPostRow[]> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("content_posts")
      .select(CONTENT_POST_SELECT)
      .eq("user_id", userId)
      .gte("scheduled_at", startIso)
      .lt("scheduled_at", endIso)
      .order("scheduled_at", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      return [];
    }

    return (data ?? []).map((row) =>
      normalizeContentPostRow(row as ContentPostRowRaw),
    );
  },
  ["content-posts-range"],
  { revalidate: 60, tags: ["content-posts"] },
);

/**
 * Unscheduled posts are no longer mixed into the range query. They used to be
 * fetched by an `or(...scheduled_at.is.null)` arm and then silently dropped by
 * the day-bucketing on the client, which made a dateless post invisible
 * everywhere. They now have their own query and their own UI surface.
 */
const _cachedUnscheduledPosts = unstable_cache(
  async (userId: string): Promise<ContentPostRow[]> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("content_posts")
      .select(CONTENT_POST_SELECT)
      .eq("user_id", userId)
      .is("scheduled_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return [];
    }

    return (data ?? []).map((row) =>
      normalizeContentPostRow(row as ContentPostRowRaw),
    );
  },
  ["content-posts-unscheduled"],
  { revalidate: 60, tags: ["content-posts"] },
);

export async function getMonthPosts(month: string): Promise<ContentPostRow[]> {
  const { user } = await getServerContext();
  if (!user) {
    return [];
  }
  const { start, end } = monthRange(month);
  return _cachedPostsInRange(user.id, start, end);
}

export async function getWeekPosts(
  weekAnchor: string,
): Promise<ContentPostRow[]> {
  const { user } = await getServerContext();
  if (!user) {
    return [];
  }
  const { start, end } = weekRange(weekAnchor);
  return _cachedPostsInRange(user.id, start, end);
}

export async function getUnscheduledPosts(): Promise<ContentPostRow[]> {
  const { user } = await getServerContext();
  if (!user) {
    return [];
  }
  return _cachedUnscheduledPosts(user.id);
}
