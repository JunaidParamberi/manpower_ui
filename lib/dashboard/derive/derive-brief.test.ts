import { describe, expect, it } from "vitest";

import { deriveBrief } from "@/lib/dashboard/derive/derive-brief";
import type { MoneyFacts, QueueItem } from "@/lib/dashboard/snapshot-types";
import type { LatestDigest } from "@/lib/projects/digest-queries";

const money: MoneyFacts = {
  primaryCurrency: "AED",
  totalRevenue: 6240,
  outstanding: 12000,
  overdue: 9975,
  outstandingCount: 3,
  overdueCount: 1,
  avgPayDays: 14,
  revenueChangePct: 12,
  byCurrency: [],
};

function queueItem(partial: Partial<QueueItem> = {}): QueueItem {
  return {
    type: "overdue_invoice",
    id: "inv-1",
    score: 180,
    href: "/documents/inv-1",
    title: "Invoice #INV-2051",
    detail: "12 days overdue",
    amount: 9975,
    currency: "AED",
    clientId: "c1",
    clientName: "Acme Design Co.",
    clientEmail: "billing@acme.test",
    action: {
      documentId: "inv-1", projectId: null, taskId: null,
      invoiceTotal: 9975, totalPaid: 0, totalWrittenOff: 0, remainingBalance: 9975,
      suggestedSubject: null, suggestedBody: null,
    },
    ...partial,
  };
}

const digest: LatestDigest = {
  id: "digest-1",
  digestDate: "2026-09-13",
  createdAt: "2026-09-13T06:00:00.000Z",
  narrative: "Two projects need a look today.",
  actions: [{ projectId: "p1", title: "Re-scope Hawthorn", detail: "4 days left, 55% done." }],
  facts: {
    generatedFor: "2026-09-13",
    currency: "AED",
    projects: [
      { id: "p1", title: "Hawthorn rebrand", deadline: "2026-09-17", completionPct: 55, score: 70, band: "high", signals: [] },
    ],
  },
};

describe("deriveBrief — narrated", () => {
  it("uses the digest narrative and its actions", () => {
    const brief = deriveBrief({ digest, queue: [], money, hasNightlyAgents: true });
    expect(brief.narrative).toBe("Two projects need a look today.");
    expect(brief.digestDate).toBe("2026-09-13");
    expect(brief.lines[0].title).toBe("Re-scope Hawthorn");
    expect(brief.showUpgradeHint).toBe(false);
  });
});

describe("deriveBrief — deterministic fallback", () => {
  it("produces the same shape with no narrative when there is no digest", () => {
    const brief = deriveBrief({ digest: null, queue: [queueItem()], money, hasNightlyAgents: false });
    expect(brief.narrative).toBeNull();
    expect(brief.lines.length).toBeGreaterThan(0);
    expect(brief.lines[0].href).toBe("/documents/inv-1");
  });

  it("leads with the most urgent queue item", () => {
    const brief = deriveBrief({
      digest: null,
      queue: [queueItem({ id: "low", score: 10, title: "Quote #QUO-1" }), queueItem({ id: "high", score: 300 })],
      money,
      hasNightlyAgents: false,
    });
    expect(brief.lines[0].title).toBe("Invoice #INV-2051");
  });

  it("adds a money line when something is overdue", () => {
    const brief = deriveBrief({ digest: null, queue: [], money, hasNightlyAgents: false });
    expect(brief.lines.some((line) => line.detail.includes("overdue"))).toBe(true);
  });

  it("says so plainly when there is nothing to report", () => {
    const quiet: MoneyFacts = { ...money, outstanding: 0, overdue: 0, overdueCount: 0, outstandingCount: 0 };
    const brief = deriveBrief({ digest: null, queue: [], money: quiet, hasNightlyAgents: false });
    expect(brief.lines).toEqual([]);
  });

  it("shows the upgrade hint only on plans the nightly agents skip", () => {
    expect(deriveBrief({ digest: null, queue: [], money, hasNightlyAgents: false }).showUpgradeHint).toBe(true);
    expect(deriveBrief({ digest: null, queue: [], money, hasNightlyAgents: true }).showUpgradeHint).toBe(false);
  });

  it("caps the number of lines", () => {
    const queue = Array.from({ length: 6 }, (_, i) => queueItem({ id: `i${i}`, score: 100 - i }));
    const brief = deriveBrief({ digest: null, queue, money, hasNightlyAgents: false, maxLines: 3 });
    expect(brief.lines).toHaveLength(3);
  });
});
