import { z } from "zod";

export type DismissalRow = {
  itemType: string;
  itemId: string;
  snoozedUntil: string | null;
  dismissedAt: string | null;
};

export const SNOOZE_DURATIONS = ["tomorrow", "next_week", "until_change"] as const;
export type SnoozeDuration = (typeof SNOOZE_DURATIONS)[number];

export const snoozeInputSchema = z.object({
  itemType: z.string().min(1).max(40),
  itemId: z.string().uuid(),
  until: z.enum(SNOOZE_DURATIONS),
});

export type SnoozeInput = z.infer<typeof snoozeInputSchema>;

/**
 * "until_change" stores no timestamp — the row is cleared by the mutation that
 * changes the subject (a payment landing, a quote being answered), so there is
 * nothing to compare against here.
 */
export function isQueueItemActive(row: DismissalRow | undefined, nowIso: string): boolean {
  if (!row) return true;
  if (row.dismissedAt !== null) return false;
  if (row.snoozedUntil === null) return true;

  // Compare instants, not strings: Postgres/PostgREST serializes timestamptz
  // as "2026-09-20 00:00:00+00" (space separator) while callers pass
  // `new Date().toISOString()` ("2026-09-13T09:00:00.000Z"). Lexicographic
  // comparison of those two formats is wrong. An unparseable timestamp must
  // never silently hide work from the user, so treat it as active.
  const snoozedUntilMs = Date.parse(row.snoozedUntil);
  const nowMs = Date.parse(nowIso);
  if (Number.isNaN(snoozedUntilMs) || Number.isNaN(nowMs)) return true;
  return snoozedUntilMs <= nowMs;
}

function key(itemType: string, itemId: string): string {
  return `${itemType}:${itemId}`;
}

export function partitionByDismissal<T extends { type: string; id: string }>(
  items: T[],
  rows: DismissalRow[],
  nowIso: string,
): { active: T[]; snoozedCount: number } {
  const byKey = new Map(rows.map((row) => [key(row.itemType, row.itemId), row]));
  const active: T[] = [];
  let snoozedCount = 0;

  for (const item of items) {
    if (isQueueItemActive(byKey.get(key(item.type, item.id)), nowIso)) {
      active.push(item);
    } else {
      snoozedCount += 1;
    }
  }

  return { active, snoozedCount };
}
