import { describe, expect, it } from "vitest";

import { deriveQueue, type QueueInvoiceInput, type QueueQuoteInput } from "@/lib/dashboard/derive/derive-queue";

const NOW = "2026-09-13T09:00:00.000Z";

function emptyArgs() {
  return {
    nowIso: NOW,
    invoices: [] as QueueInvoiceInput[],
    quotes: [] as QueueQuoteInput[],
    drafts: [],
    projects: [],
    tasks: [],
    followUps: [],
    dismissals: [],
  };
}

function invoice(partial: Partial<QueueInvoiceInput> = {}): QueueInvoiceInput {
  return {
    id: "inv-1",
    number: "INV-2051",
    dueDate: "2026-09-01",
    status: "sent",
    currency: "AED",
    total: 10000,
    paid: 0,
    writtenOff: 0,
    clientId: "c1",
    clientName: "Acme Design Co.",
    clientEmail: "billing@acme.test",
    ...partial,
  };
}

function quote(partial: Partial<QueueQuoteInput> = {}): QueueQuoteInput {
  return {
    id: "q-1",
    number: "QUO-0012",
    status: "sent",
    sentAt: "2026-09-01T00:00:00.000Z",
    validUntil: "2026-10-01",
    approvedAt: null,
    convertedInvoiceId: null,
    currency: "AED",
    total: 5000,
    clientId: "c2",
    clientName: "Maple Co.",
    clientEmail: "hello@maple.test",
    ...partial,
  };
}

describe("deriveQueue — overdue invoices", () => {
  it("reports the balance still owed, in the invoice's own currency", () => {
    const { items } = deriveQueue({ ...emptyArgs(), invoices: [invoice({ paid: 4000, status: "partially_paid" })] });
    expect(items).toHaveLength(1);
    expect(items[0].amount).toBe(6000);
    expect(items[0].currency).toBe("AED");
    expect(items[0].action.remainingBalance).toBe(6000);
  });

  it("drops an invoice whose balance is fully covered by payments and write-offs", () => {
    const { items } = deriveQueue({
      ...emptyArgs(),
      invoices: [invoice({ paid: 6000, writtenOff: 4000 })],
    });
    expect(items).toEqual([]);
  });

  it("ignores an invoice that is not yet due", () => {
    const { items } = deriveQueue({ ...emptyArgs(), invoices: [invoice({ dueDate: "2026-12-01" })] });
    expect(items).toEqual([]);
  });

  it("ranks a longer-overdue invoice above a shorter one", () => {
    const { items } = deriveQueue({
      ...emptyArgs(),
      invoices: [
        invoice({ id: "recent", dueDate: "2026-09-11" }),
        invoice({ id: "ancient", dueDate: "2026-06-01" }),
      ],
    });
    expect(items.map((i) => i.id)).toEqual(["ancient", "recent"]);
  });
});

describe("deriveQueue — quote signals", () => {
  it("flags a quote expiring within three days", () => {
    const { items } = deriveQueue({ ...emptyArgs(), quotes: [quote({ validUntil: "2026-09-15" })] });
    expect(items[0].type).toBe("expiring_quote");
  });

  it("flags a quote sent over a week ago with no response", () => {
    const { items } = deriveQueue({ ...emptyArgs(), quotes: [quote({ sentAt: "2026-09-01T00:00:00.000Z" })] });
    expect(items[0].type).toBe("quote_no_response");
  });

  it("flags an approved quote that was never invoiced", () => {
    const { items } = deriveQueue({
      ...emptyArgs(),
      quotes: [quote({ status: "approved", approvedAt: "2026-09-04T00:00:00.000Z", convertedInvoiceId: null })],
    });
    expect(items[0].type).toBe("quote_not_invoiced");
    expect(items[0].action.documentId).toBe("q-1");
  });

  it("does not flag an approved quote that already became an invoice", () => {
    const { items } = deriveQueue({
      ...emptyArgs(),
      quotes: [quote({ status: "approved", approvedAt: "2026-09-04T00:00:00.000Z", convertedInvoiceId: "inv-9" })],
    });
    expect(items).toEqual([]);
  });

  it("emits one card per quote, never two", () => {
    const { items } = deriveQueue({
      ...emptyArgs(),
      quotes: [quote({ sentAt: "2026-08-01T00:00:00.000Z", validUntil: "2026-09-15" })],
    });
    expect(items).toHaveLength(1);
  });
});

describe("deriveQueue — drafts", () => {
  it("flags a draft that has sat unsent for more than a week", () => {
    const { items } = deriveQueue({
      ...emptyArgs(),
      drafts: [
        {
          id: "d-1",
          title: "Website redesign",
          type: "invoice",
          createdAt: "2026-09-01T00:00:00.000Z",
          currency: "AED",
          total: 3000,
          clientId: "c1",
          clientName: "Acme Design Co.",
          clientEmail: "billing@acme.test",
        },
      ],
    });
    expect(items[0].type).toBe("draft_unsent");
  });

  it("leaves a fresh draft alone", () => {
    const { items } = deriveQueue({
      ...emptyArgs(),
      drafts: [
        {
          id: "d-2",
          title: "New quote",
          type: "quote",
          createdAt: "2026-09-12T00:00:00.000Z",
          currency: "AED",
          total: 3000,
          clientId: null,
          clientName: null,
          clientEmail: null,
        },
      ],
    });
    expect(items).toEqual([]);
  });
});

describe("deriveQueue — dedupe and snooze", () => {
  it("keeps one card when a follow-up rung and an overdue invoice share a subject", () => {
    const { items } = deriveQueue({
      ...emptyArgs(),
      invoices: [invoice()],
      followUps: [
        {
          id: "f-1",
          subjectId: "inv-1",
          subjectType: "document",
          triggerType: "invoice_overdue",
          rung: 2,
          tone: "firm",
          clientId: "c1",
          clientName: "Acme Design Co.",
          clientEmail: "billing@acme.test",
        },
      ],
    });
    expect(items).toHaveLength(1);
    // The follow-up wins: it carries the escalation tone for the prefill.
    expect(items[0].type).toBe("follow_up_due");
  });

  it("hides snoozed items and counts them", () => {
    const { items, snoozedCount } = deriveQueue({
      ...emptyArgs(),
      invoices: [invoice()],
      dismissals: [
        { itemType: "overdue_invoice", itemId: "inv-1", snoozedUntil: "2026-09-20T00:00:00.000Z", dismissedAt: null },
      ],
    });
    expect(items).toEqual([]);
    expect(snoozedCount).toBe(1);
  });

  it("caps the list at the requested limit without losing the snoozed count", () => {
    const invoices = Array.from({ length: 8 }, (_, i) =>
      invoice({ id: `inv-${i}`, number: `INV-${i}`, dueDate: "2026-09-01" }),
    );
    const { items } = deriveQueue({ ...emptyArgs(), invoices, limit: 5 });
    expect(items).toHaveLength(5);
  });
});
