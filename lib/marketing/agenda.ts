import { groupPostsByDay } from "@/lib/marketing/calendar-utils";

export type AgendaDay<T> = {
  iso: string; // YYYY-MM-DD, local calendar day
  posts: T[]; // ordered by time of day
};

export type AgendaGroups<T> = {
  days: AgendaDay<T>[]; // chronological, non-empty groups only
  unscheduled: T[];
};

function timeOf(value: Date | string | null): number {
  // scheduledAt crosses unstable_cache, so it can arrive as a Date or an ISO
  // string. Wrap before calling getTime.
  return value ? new Date(value).getTime() : 0;
}

/**
 * Splits posts into chronological day groups plus an unscheduled bucket.
 *
 * Only days that actually have posts become groups — the old list view mapped
 * over every status unconditionally and printed an empty section for each one.
 */
export function buildAgendaGroups<
  T extends { scheduledAt: Date | string | null },
>(posts: T[]): AgendaGroups<T> {
  const unscheduled = posts.filter((post) => !post.scheduledAt);
  const byDay = groupPostsByDay(posts);

  const days = Object.keys(byDay)
    .sort()
    .map((iso) => ({
      iso,
      posts: [...byDay[iso]].sort(
        (a, b) => timeOf(a.scheduledAt) - timeOf(b.scheduledAt),
      ),
    }));

  return { days, unscheduled };
}
