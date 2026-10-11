import type { TimeEntryRow } from "@/types";

/** Wall elapsed minus completed pause seconds; when paused, freezes at paused_at. */
export function billableElapsedSecondsForOpenEntry(
  entry: Pick<
    TimeEntryRow,
    "started_at" | "paused_at" | "total_paused_seconds"
  >,
  now: Date,
): number {
  const startMs = new Date(entry.started_at).getTime();
  const endMs = entry.paused_at
    ? new Date(entry.paused_at).getTime()
    : now.getTime();
  const wallSeconds = Math.floor((endMs - startMs) / 1000);
  const pausedTotal = entry.total_paused_seconds ?? 0;
  return Math.max(0, wallSeconds - pausedTotal);
}
