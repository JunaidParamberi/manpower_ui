import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  lastDayOfMonth,
  parseISO,
} from "date-fns";

export type Interval = "daily" | "weekly" | "monthly" | "yearly";

export type ScheduleState = {
  interval: Interval;
  interval_count: number;
  next_run_at: string;
  end_date: string | null;
  occurrences_limit: number | null;
  occurrences_count: number;
};

function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/**
 * Advance a date by interval * count. Monthly clamps to end-of-month
 * (e.g. Jan 31 + 1 month → Feb 28/29).
 */
export function advanceDate(
  from: string,
  interval: Interval,
  count: number,
): string {
  const base = parseISO(from);
  if (interval === "daily") {
    return toIsoDate(addDays(base, count));
  }
  if (interval === "weekly") {
    return toIsoDate(addWeeks(base, count));
  }
  if (interval === "yearly") {
    return toIsoDate(addYears(base, count));
  }

  const target = addMonths(base, count);
  const lastDay = lastDayOfMonth(target);
  if (base.getDate() > lastDay.getDate()) {
    return toIsoDate(lastDay);
  }
  return toIsoDate(target);
}

/** Period [start, end) covered by the invoice being generated now. */
export function periodFor(
  nextRunAt: string,
  interval: Interval,
  count: number,
): { periodStart: string; periodEnd: string } {
  return {
    periodStart: nextRunAt,
    periodEnd: advanceDate(nextRunAt, interval, count),
  };
}

/**
 * Compute the next next_run_at after a successful generation, or null
 * when the schedule is finished (end_date or occurrences_limit).
 */
export function nextRunAfter(
  schedule: ScheduleState,
  justRanAt: string,
): string | null {
  const next = advanceDate(
    schedule.next_run_at,
    schedule.interval,
    schedule.interval_count,
  );

  if (schedule.end_date && next > schedule.end_date) {
    return null;
  }

  if (
    schedule.occurrences_limit !== null &&
    schedule.occurrences_count + 1 >= schedule.occurrences_limit
  ) {
    return null;
  }

  void justRanAt;
  return next;
}

/** First schedule date on or after referenceDate (never backfills past periods). */
export function nextDueOnOrAfter(
  from: string,
  interval: Interval,
  count: number,
  referenceDate: string,
): string {
  let d = from;
  while (d < referenceDate) {
    d = advanceDate(d, interval, count);
  }
  return d;
}
