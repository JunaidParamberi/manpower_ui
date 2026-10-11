import {
  startOfDay,
  endOfDay,
  startOfMonth,
  startOfYear,
  subMonths,
  format,
  parseISO,
  isValid,
} from "date-fns";
import type { DateRange, RevenueRangeId } from "./types";

/** Anything older than this is "all time" for revenue charting purposes. */
const ALL_TIME_START = new Date("2000-01-01T00:00:00.000Z");

export const REVENUE_RANGE_IDS: readonly RevenueRangeId[] = ["6m", "1y", "all"];

export function currentMonthRange(): DateRange {
  return { from: startOfMonth(new Date()), to: new Date() };
}

export function lastNMonthsRange(n: number): DateRange {
  return { from: startOfDay(subMonths(new Date(), n)), to: new Date() };
}

export function yearToDateRange(): DateRange {
  return { from: startOfYear(new Date()), to: new Date() };
}

export function previousPeriodRange(current: DateRange): DateRange {
  const durationMs = current.to.getTime() - current.from.getTime();
  return {
    from: new Date(current.from.getTime() - durationMs),
    to: new Date(current.from.getTime()),
  };
}

export function formatDateParam(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateRangeParams(
  from: string | undefined,
  to: string | undefined
): DateRange {
  if (!from || !to) return currentMonthRange();
  const parsedFrom = parseISO(from);
  const parsedTo = endOfDay(parseISO(to));
  if (!isValid(parsedFrom) || !isValid(parsedTo)) return currentMonthRange();
  return { from: parsedFrom, to: parsedTo };
}

/**
 * Day-granular cache key for a range. `unstable_cache` keys on its arguments,
 * so passing a live `new Date()` timestamp gives every request a unique key
 * and the cache never hits. Rounding to the day keeps the key stable for the
 * whole day while `revalidate`/`revalidateTag` still control freshness.
 */
export function rangeCacheKey(range: DateRange): { fromDay: string; toDay: string } {
  return { fromDay: format(range.from, "yyyy-MM-dd"), toDay: format(range.to, "yyyy-MM-dd") };
}

/** Rebuilds a full-day range from the day keys stored in the cache key. */
export function rangeFromCacheKey(fromDay: string, toDay: string): DateRange {
  return { from: startOfDay(parseISO(fromDay)), to: endOfDay(parseISO(toDay)) };
}

export function parseRevenueRangeParam(value: string | undefined): RevenueRangeId {
  return REVENUE_RANGE_IDS.includes(value as RevenueRangeId)
    ? (value as RevenueRangeId)
    : "6m";
}

export function revenueRange(id: RevenueRangeId): DateRange {
  const to = new Date();
  if (id === "all") return { from: ALL_TIME_START, to };
  return { from: startOfDay(subMonths(to, id === "1y" ? 12 : 6)), to };
}
