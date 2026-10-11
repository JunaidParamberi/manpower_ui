/**
 * Local date/time ↔ ISO datetime conversion for content posts.
 *
 * Posts are composed from local Date parts on write, so they must be split
 * and bucketed with local getters on read (see groupPostsByDay). Keeping all
 * of that math in one tested module means the post dialog and the calendar
 * drag handler cannot drift apart.
 */

export const DEFAULT_POST_TIME = "09:00";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local YYYY-MM-DD / HH:mm split of an ISO datetime, in the viewer's timezone. */
export function splitScheduledAt(value: Date | string | null): {
  date: string;
  time: string;
} {
  if (!value) return { date: "", time: "" };
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Combine a local YYYY-MM-DD date + HH:mm time into a UTC ISO datetime, or null. */
export function combineScheduledAt(date: string, time: string): string | null {
  if (!date) return null;
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = (time || DEFAULT_POST_TIME).split(":").map(Number);
  const local = new Date(
    year,
    (month ?? 1) - 1,
    day ?? 1,
    hours ?? 9,
    minutes ?? 0,
    0,
    0,
  );
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

/**
 * Moves a post to a different calendar day, preserving its time of day.
 * A post with no previous time (dragged out of the unscheduled rail) lands at
 * DEFAULT_POST_TIME.
 */
export function moveScheduledAtToDay(
  current: Date | string | null,
  targetIso: string,
): string {
  const { time } = splitScheduledAt(current);
  const next = combineScheduledAt(targetIso, time || DEFAULT_POST_TIME);
  // combineScheduledAt only returns null for an empty date string, and
  // targetIso always comes from a calendar cell, so this fallback is
  // unreachable in practice — it exists to keep the return type non-null.
  return next ?? new Date().toISOString();
}

/**
 * "09:00" / "18:05" / "" — zero-padded local 24-hour time, matching the
 * `<input type="time">` the dialog uses. Deliberately not toLocaleTimeString:
 * that varies by runtime locale and would make output untestable.
 */
export function formatPostTime(value: Date | string | null): string {
  return splitScheduledAt(value).time;
}
