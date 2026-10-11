import { describe, expect, it } from "vitest";

import {
  extractDocumentEvents,
  mergeAndSortEvents,
} from "./activity-utils";
import type { ActivityEvent } from "./types";

const baseDoc = {
  id: "doc-1",
  type: "invoice" as const,
  sent_at: "2026-05-10T10:00:00.000Z",
  paid_at: null as string | null,
  approved_at: null as string | null,
  declined_at: null as string | null,
  invoice_number: "1042",
  quote_number: null,
  title: "Invoice",
  clientName: "Acme Corp",
  amount: 1200,
};

describe("extractDocumentEvents", () => {
  it("returns invoice_paid when paid_at is set", () => {
    const events = extractDocumentEvents({
      ...baseDoc,
      paid_at: "2026-05-12T14:00:00.000Z",
    });
    expect(events).toHaveLength(2);
    const paid = events.find((e) => e.type === "invoice_paid");
    expect(new Date(paid?.timestamp ?? "").toISOString()).toBe("2026-05-12T14:00:00.000Z");
    expect(paid?.label).toContain("1042");
    expect(paid?.label).toContain("Acme Corp");
  });

  it("returns doc_sent when sent_at is set", () => {
    const events = extractDocumentEvents(baseDoc);
    expect(events.some((e) => e.type === "doc_sent")).toBe(true);
  });

  it("returns quote_approved when approved_at is set", () => {
    const events = extractDocumentEvents({
      ...baseDoc,
      type: "quote",
      quote_number: "Q-9",
      approved_at: "2026-05-11T09:00:00.000Z",
    });
    expect(events.some((e) => e.type === "quote_approved")).toBe(true);
  });

  it("returns nothing for a draft document", () => {
    const events = extractDocumentEvents({
      ...baseDoc,
      sent_at: null,
      paid_at: null,
      approved_at: null,
      declined_at: null,
    });
    expect(events).toHaveLength(0);
  });
});

describe("mergeAndSortEvents", () => {
  const mk = (id: string, ts: string): ActivityEvent => ({
    type: "doc_sent",
    id,
    href: `/documents/${id}`,
    who: "You",
    text: id,
    label: id,
    timestamp: new Date(ts),
  });

  it("sorts by timestamp DESC", () => {
    const merged = mergeAndSortEvents(
      [mk("a", "2026-05-01T00:00:00.000Z"), mk("b", "2026-05-10T00:00:00.000Z")],
      10
    );
    expect(merged[0]?.id).toBe("b");
  });

  it("limits to N events", () => {
    const merged = mergeAndSortEvents(
      [
        mk("a", "2026-05-01T00:00:00.000Z"),
        mk("b", "2026-05-02T00:00:00.000Z"),
        mk("c", "2026-05-03T00:00:00.000Z"),
      ],
      2
    );
    expect(merged).toHaveLength(2);
  });

  it("handles empty arrays", () => {
    expect(mergeAndSortEvents([], 10)).toEqual([]);
  });
});

describe("extractDocumentEvents — currency", () => {
  const base = {
    id: "doc-1",
    type: "invoice" as const,
    sent_at: null,
    paid_at: null,
    approved_at: null,
    declined_at: null,
    invoice_number: "INV-001",
    quote_number: null,
    title: "Invoice",
    clientName: "Acme",
    amount: 6240,
    currency: "AED",
  };

  it("carries the document's own currency onto money events", () => {
    const [paid] = extractDocumentEvents({
      ...base,
      paid_at: "2026-09-10T07:11:52.719Z",
    });
    expect(paid.amount).toBe(6240);
    expect(paid.currency).toBe("AED");
  });

  it("carries currency onto approved quotes too", () => {
    const [approved] = extractDocumentEvents({
      ...base,
      type: "quote",
      quote_number: "Q-001",
      approved_at: "2026-09-10T07:11:52.719Z",
    });
    expect(approved.currency).toBe("AED");
  });
});
