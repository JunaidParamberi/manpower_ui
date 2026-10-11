export type CalendarDay = {
  date: string; // day-of-month label, e.g. "1"
  iso: string; // YYYY-MM-DD
  inMonth: boolean;
  isToday: boolean;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoOf(y: number, m0: number, d: number): string {
  return `${y}-${pad(m0 + 1)}-${pad(d)}`;
}

export function buildMonthGrid(
  year: number,
  month0: number,
  today: Date | null = new Date(),
): CalendarDay[] {
  const first = new Date(Date.UTC(year, month0, 1));
  // Monday-first: JS getUTCDay Sun=0..Sat=6 → shift so Mon=0
  const lead = (first.getUTCDay() + 6) % 7;
  const start = new Date(first);
  start.setUTCDate(1 - lead);
  // isToday compares against local calendar day (matches groupPostsByDay /
  // bucketEventsByDay, which key by local time to match the write path).
  // `today` is null pre-mount on the client (see MonthCalendar) so the
  // server's UTC "now" never disagrees with the browser's local "now" —
  // no cell matches until the client resolves its own local date in a
  // useEffect, avoiding an SSR/CSR hydration mismatch near local midnight.
  const todayIso = today
    ? isoOf(today.getFullYear(), today.getMonth(), today.getDate())
    : "";
  const cells: CalendarDay[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const iso = isoOf(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    cells.push({
      date: String(d.getUTCDate()),
      iso,
      inMonth: d.getUTCMonth() === month0,
      isToday: iso === todayIso,
    });
  }
  return cells;
}

export function groupPostsByDay<
  T extends { scheduledAt: Date | string | null },
>(posts: T[]): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const post of posts) {
    if (!post.scheduledAt) continue;
    const d = new Date(post.scheduledAt);
    // Local time: scheduledAt is written as a local Date (see
    // content-post-sheet's combineScheduledAt) so it must be bucketed back
    // using local getters, not UTC ones, or posts near midnight land on the
    // wrong calendar day for non-UTC users.
    const key = isoOf(d.getFullYear(), d.getMonth(), d.getDate());
    (out[key] ??= []).push(post);
  }
  return out;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Seven consecutive days from a Monday anchor. Uses UTC arithmetic for the
 * day walk (like buildMonthGrid) so a DST transition inside the week cannot
 * duplicate or skip a day, while `isToday` still compares against the local
 * calendar day to match how posts are bucketed.
 */
export function buildWeekGrid(
  weekAnchorIso: string,
  today: Date | null = new Date(),
): CalendarDay[] {
  const [year, month, day] = weekAnchorIso.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  const todayIso = today
    ? isoOf(today.getFullYear(), today.getMonth(), today.getDate())
    : "";

  const cells: CalendarDay[] = [];
  for (let i = 0; i < 7; i += 1) {
    const cur = new Date(start);
    cur.setUTCDate(start.getUTCDate() + i);
    const iso = isoOf(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate());
    cells.push({
      date: String(cur.getUTCDate()),
      iso,
      // Week view has no out-of-range days: all seven are the view.
      inMonth: true,
      isToday: iso === todayIso,
    });
  }
  return cells;
}

/** Moves a Monday anchor by whole weeks. */
export function rollWeek(weekAnchorIso: string, delta: number): string {
  const [year, month, day] = weekAnchorIso.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + delta * 7));
  return isoOf(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate());
}

/** Moves a YYYY-MM month string by whole months. */
export function rollMonth(month: string, delta: number): string {
  const [year, month1] = month.split("-").map(Number);
  const total = year * 12 + (month1 - 1) + delta;
  const nextYear = Math.floor(total / 12);
  const nextMonth0 = ((total % 12) + 12) % 12;
  return `${nextYear}-${pad(nextMonth0 + 1)}`;
}

/** "June 2026" */
export function monthLabel(month: string): string {
  const [year, month1] = month.split("-").map(Number);
  return `${MONTH_NAMES[month1 - 1]} ${year}`;
}

/** "Jun 15 – 21, 2026", or "Jun 29 – Jul 5, 2026" across a month boundary. */
export function weekRangeLabel(weekAnchorIso: string): string {
  const [year, month, day] = weekAnchorIso.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  const end = new Date(Date.UTC(year, month - 1, day + 6));

  const startMonth = MONTH_NAMES_SHORT[start.getUTCMonth()];
  const endMonth = MONTH_NAMES_SHORT[end.getUTCMonth()];
  const head = `${startMonth} ${start.getUTCDate()}`;
  const tail =
    startMonth === endMonth
      ? String(end.getUTCDate())
      : `${endMonth} ${end.getUTCDate()}`;

  return `${head} – ${tail}, ${end.getUTCFullYear()}`;
}
