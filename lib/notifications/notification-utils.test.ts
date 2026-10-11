import { describe, expect, it } from "vitest";

import type { NotificationRow } from "@/types";

import {
  formatNotificationBadgeCount,
  formatNotificationTimestamp,
  groupNotificationsByTime,
  normalizeNotificationPayload,
  partitionNotifications,
} from "./notification-utils";

function row(
  overrides: Partial<NotificationRow> & Pick<NotificationRow, "id" | "created_at">
): NotificationRow {
  return {
    user_id: "u1",
    type: "invoice_paid",
    payload: {
      href: "/documents/d1",
      entity_id: "d1",
      title: "Invoice #INV-0001 paid",
      body: "Acme Corp",
    },
    read_at: null,
    action_taken_at: null,
    updated_at: overrides.created_at,
    ...overrides,
  };
}

describe("normalizeNotificationPayload", () => {
  it("returns payload when valid", () => {
    expect(
      normalizeNotificationPayload({
        href: "/documents/x",
        entity_id: "x",
        title: "Invoice #INV-0001 paid",
        body: "Acme Corp",
      })
    ).toEqual({
      href: "/documents/x",
      entity_id: "x",
      title: "Invoice #INV-0001 paid",
      body: "Acme Corp",
    });
  });

  it("omits body when absent", () => {
    const payload = normalizeNotificationPayload({
      href: "/documents/x",
      entity_id: "x",
      title: "Quote #QUO-0002 approved",
    });
    expect(payload).toEqual({
      href: "/documents/x",
      entity_id: "x",
      title: "Quote #QUO-0002 approved",
    });
    expect(payload).not.toHaveProperty("body");
  });

  it("treats a blank body as absent", () => {
    expect(
      normalizeNotificationPayload({
        href: "/documents/x",
        entity_id: "x",
        title: "Quote approved",
        body: "   ",
      })
    ).not.toHaveProperty("body");
  });

  it("folds a legacy label into the title", () => {
    expect(
      normalizeNotificationPayload({
        href: "/documents/x",
        entity_id: "x",
        label: "Invoice #INV-0001 paid · Acme Corp",
      })
    ).toEqual({
      href: "/documents/x",
      entity_id: "x",
      title: "Invoice #INV-0001 paid · Acme Corp",
    });
  });

  it("prefers title over a legacy label when a row carries both", () => {
    expect(
      normalizeNotificationPayload({
        href: "/documents/x",
        entity_id: "x",
        title: "Invoice #INV-0001 paid",
        label: "stale legacy text",
      })?.title
    ).toBe("Invoice #INV-0001 paid");
  });

  it("returns null when neither title nor label is present", () => {
    expect(
      normalizeNotificationPayload({ href: "/x", entity_id: "x" })
    ).toBeNull();
  });

  it("returns null for a blank title with no label", () => {
    expect(
      normalizeNotificationPayload({ href: "/x", entity_id: "x", title: "  " })
    ).toBeNull();
  });

  it("returns null when invalid", () => {
    expect(normalizeNotificationPayload({ href: "/x" })).toBeNull();
  });
});

describe("partitionNotifications", () => {
  it("splits unread and read", () => {
    const { unread, read } = partitionNotifications([
      row({ id: "1", created_at: "2026-05-15T10:00:00Z", read_at: null }),
      row({
        id: "2",
        created_at: "2026-05-14T10:00:00Z",
        read_at: "2026-05-14T12:00:00Z",
      }),
    ]);
    expect(unread).toHaveLength(1);
    expect(read).toHaveLength(1);
  });
});

describe("formatNotificationBadgeCount", () => {
  it("returns null for zero", () => {
    expect(formatNotificationBadgeCount(0)).toBeNull();
  });

  it("caps at 9+", () => {
    expect(formatNotificationBadgeCount(10)).toBe("9+");
    expect(formatNotificationBadgeCount(3)).toBe("3");
  });
});

describe("groupNotificationsByTime", () => {
  it("orders groups today before earlier", () => {
    const now = new Date("2026-05-15T14:00:00Z");
    const groups = groupNotificationsByTime(
      [
        row({
          id: "old",
          created_at: "2026-05-01T10:00:00Z",
        }),
        row({
          id: "today",
          created_at: "2026-05-15T09:00:00Z",
        }),
      ],
      now
    );
    expect(groups[0]?.group).toBe("today");
    expect(groups.at(-1)?.group).toBe("earlier");
  });
});

describe("formatNotificationTimestamp", () => {
  const now = new Date("2026-05-22T12:00:00Z");

  it("says 'Just now' under a minute", () => {
    expect(
      formatNotificationTimestamp(new Date("2026-05-22T11:59:30Z"), now)
    ).toBe("Just now");
  });

  it("counts whole minutes under an hour", () => {
    expect(
      formatNotificationTimestamp(new Date("2026-05-22T11:18:00Z"), now)
    ).toBe("42m ago");
  });

  it("counts whole hours under a day, with no 'about' hedge", () => {
    const result = formatNotificationTimestamp(
      new Date("2026-05-21T22:00:00Z"),
      now
    );
    expect(result).toBe("14h ago");
    expect(result).not.toContain("about");
  });

  it("counts days up to a week", () => {
    expect(
      formatNotificationTimestamp(new Date("2026-05-19T12:00:00Z"), now)
    ).toBe("3d ago");
    expect(
      formatNotificationTimestamp(new Date("2026-05-15T12:00:00Z"), now)
    ).toBe("7d ago");
  });

  it("switches to a calendar date past a week", () => {
    expect(
      formatNotificationTimestamp(new Date("2026-05-10T12:00:00Z"), now)
    ).toBe("May 10");
  });

  it("accepts an ISO string", () => {
    expect(formatNotificationTimestamp("2026-05-22T09:00:00Z", now)).toBe(
      "3h ago"
    );
  });
});
