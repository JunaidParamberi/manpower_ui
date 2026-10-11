"use client";

import { useMemo } from "react";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Buckets any event array by local calendar day (YYYY-MM-DD).
 *
 * Local time, not UTC: scheduledAt is composed from local Date parts on write
 * (see lib/marketing/schedule-utils.ts combineScheduledAt) and buildMonthGrid
 * keys its cells the same way, so posts near midnight land on the day the user
 * actually picked in their own timezone.
 *
 * Events with no date are skipped. Callers that own dateless records must
 * render them somewhere else — /marketing uses the unscheduled rail.
 */
export function useDayBuckets<E>(
  events: E[],
  eventDate: (event: E) => Date | string | null,
): Record<string, E[]> {
  return useMemo(() => {
    const out: Record<string, E[]> = {};
    for (const event of events) {
      const raw = eventDate(event);
      if (!raw) continue;
      const d = raw instanceof Date ? raw : new Date(raw);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      (out[key] ??= []).push(event);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);
}
