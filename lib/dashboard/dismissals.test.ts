import { describe, expect, it } from "vitest";

import {
  isQueueItemActive,
  partitionByDismissal,
  snoozeInputSchema,
  type DismissalRow,
} from "@/lib/dashboard/dismissals";

const NOW = "2026-09-13T09:00:00.000Z";

function row(partial: Partial<DismissalRow> = {}): DismissalRow {
  return { itemType: "overdue_invoice", itemId: "i1", snoozedUntil: null, dismissedAt: null, ...partial };
}

describe("isQueueItemActive", () => {
  it("keeps an item with no dismissal row", () => {
    expect(isQueueItemActive(undefined, NOW)).toBe(true);
  });

  it("hides a dismissed item", () => {
    expect(isQueueItemActive(row({ dismissedAt: "2026-09-01T00:00:00.000Z" }), NOW)).toBe(false);
  });

  it("hides an item snoozed into the future", () => {
    expect(isQueueItemActive(row({ snoozedUntil: "2026-09-20T00:00:00.000Z" }), NOW)).toBe(false);
  });

  it("shows an item whose snooze has elapsed", () => {
    expect(isQueueItemActive(row({ snoozedUntil: "2026-09-12T00:00:00.000Z" }), NOW)).toBe(true);
  });

  it("hides an item snoozed into the future, stored in Postgres timestamptz format", () => {
    expect(isQueueItemActive(row({ snoozedUntil: "2026-09-20 00:00:00+00" }), NOW)).toBe(false);
  });

  it("shows an item whose Postgres-format snooze has elapsed", () => {
    expect(isQueueItemActive(row({ snoozedUntil: "2026-09-12 00:00:00+00" }), NOW)).toBe(true);
  });

  it("shows an item with an unparseable snoozedUntil rather than hiding it", () => {
    expect(isQueueItemActive(row({ snoozedUntil: "not a date" }), NOW)).toBe(true);
  });
});

describe("partitionByDismissal", () => {
  it("splits active items from snoozed ones and counts the hidden", () => {
    const items = [
      { type: "overdue_invoice", id: "i1" },
      { type: "overdue_invoice", id: "i2" },
      { type: "overdue_task", id: "t1" },
    ];
    const result = partitionByDismissal(
      items,
      [
        row({ itemId: "i2", snoozedUntil: "2026-09-20T00:00:00.000Z" }),
        row({ itemType: "overdue_task", itemId: "t1", dismissedAt: NOW }),
      ],
      NOW,
    );
    expect(result.active.map((i) => i.id)).toEqual(["i1"]);
    expect(result.snoozedCount).toBe(2);
  });

  it("matches rows on type AND id, not id alone", () => {
    const items = [{ type: "overdue_invoice", id: "x" }];
    const result = partitionByDismissal(
      items,
      [row({ itemType: "overdue_task", itemId: "x", dismissedAt: NOW })],
      NOW,
    );
    expect(result.active).toHaveLength(1);
    expect(result.snoozedCount).toBe(0);
  });
});

describe("snoozeInputSchema", () => {
  it("accepts a known duration", () => {
    const parsed = snoozeInputSchema.safeParse({
      itemType: "overdue_invoice",
      itemId: "0b5d2f3e-1c4a-4d8b-9f1e-2a3b4c5d6e7f",
      until: "next_week",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an unknown duration", () => {
    const parsed = snoozeInputSchema.safeParse({
      itemType: "overdue_invoice",
      itemId: "0b5d2f3e-1c4a-4d8b-9f1e-2a3b4c5d6e7f",
      until: "someday",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a non-uuid item id", () => {
    const parsed = snoozeInputSchema.safeParse({
      itemType: "overdue_invoice",
      itemId: "not-a-uuid",
      until: "tomorrow",
    });
    expect(parsed.success).toBe(false);
  });
});
