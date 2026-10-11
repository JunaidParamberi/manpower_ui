import { describe, it, expect } from "vitest";

import {
  detectFollowUps,
  LADDER,
  type ExistingFollowUp,
  type FollowUpDocumentInput,
  type FollowUpProjectInput,
} from "./detect";
import { FOLLOW_UP_LADDER, type FollowUpTrigger } from "./ladder";

const NOW = "2026-07-30T09:00:00.000Z";

function invoice(
  overrides: Partial<FollowUpDocumentInput> = {},
): FollowUpDocumentInput {
  return {
    id: "d1",
    clientId: "c1",
    type: "invoice",
    status: "sent",
    number: "INV-0007",
    currency: "AED",
    dueDate: "2026-07-20",
    sentAt: "2026-07-06T09:00:00.000Z",
    updatedAt: "2026-07-06T09:00:00.000Z",
    amount: 4200,
    ...overrides,
  };
}

function proposal(
  overrides: Partial<FollowUpDocumentInput> = {},
): FollowUpDocumentInput {
  return {
    id: "d2",
    clientId: "c1",
    type: "proposal",
    status: "sent",
    number: "PRO-0003",
    currency: "AED",
    dueDate: null,
    sentAt: "2026-07-20T09:00:00.000Z",
    updatedAt: "2026-07-20T09:00:00.000Z",
    amount: 9000,
    ...overrides,
  };
}

function project(
  overrides: Partial<FollowUpProjectInput> = {},
): FollowUpProjectInput {
  return {
    id: "p1",
    clientId: "c1",
    title: "Brand Refresh",
    status: "active",
    updatedAt: "2026-07-10T09:00:00.000Z",
    lastTaskActivityAt: null,
    ...overrides,
  };
}

function run(input: {
  documents?: FollowUpDocumentInput[];
  projects?: FollowUpProjectInput[];
  existing?: ExistingFollowUp[];
  nowIso?: string;
}) {
  return detectFollowUps({
    documents: input.documents ?? [],
    projects: input.projects ?? [],
    existing: input.existing ?? [],
    nowIso: input.nowIso ?? NOW,
  });
}

describe("ladder parity", () => {
  // detect.ts cannot import ladder.ts under Deno, so it duplicates the offsets.
  // This test is the only thing keeping the two copies honest.
  it("keeps detect.ts LADDER offsets identical to FOLLOW_UP_LADDER", () => {
    const triggers = Object.keys(FOLLOW_UP_LADDER) as FollowUpTrigger[];

    expect(Object.keys(LADDER).sort()).toEqual([...triggers].sort());

    for (const trigger of triggers) {
      expect(LADDER[trigger]).toEqual(
        FOLLOW_UP_LADDER[trigger].map((rung) => rung.offsetDays),
      );
    }
  });
});

describe("detectFollowUps — invoice_overdue", () => {
  it("fires on the boundary day (3 days overdue)", () => {
    // due 2026-07-27, now 2026-07-30 => exactly 3 days overdue
    const { candidates } = run({ documents: [invoice({ dueDate: "2026-07-27" })] });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      triggerType: "invoice_overdue",
      subjectType: "document",
      subjectId: "d1",
      clientId: "c1",
      rung: 0,
    });
  });

  it("does not fire the day before the boundary", () => {
    // due 2026-07-28 => 2 days overdue
    const { candidates } = run({ documents: [invoice({ dueDate: "2026-07-28" })] });

    expect(candidates).toHaveLength(0);
  });

  it("carries display facts for the card", () => {
    const { candidates } = run({ documents: [invoice({ dueDate: "2026-07-27" })] });

    expect(candidates[0].facts).toEqual({
      documentNumber: "INV-0007",
      documentType: "invoice",
      currency: "AED",
      amount: 4200,
      daysOverdue: 3,
    });
  });

  it("ignores paid invoices", () => {
    const { candidates } = run({
      documents: [invoice({ status: "paid", dueDate: "2026-06-01" })],
    });

    expect(candidates).toHaveLength(0);
  });

  it("ignores draft invoices", () => {
    const { candidates } = run({
      documents: [invoice({ status: "draft", dueDate: "2026-06-01" })],
    });

    expect(candidates).toHaveLength(0);
  });

  it("ignores invoices with a zero outstanding balance", () => {
    const { candidates } = run({
      documents: [invoice({ amount: 0, dueDate: "2026-06-01" })],
    });

    expect(candidates).toHaveLength(0);
  });

  it("ignores invoices with no due date", () => {
    const { candidates } = run({ documents: [invoice({ dueDate: null })] });

    expect(candidates).toHaveLength(0);
  });

  it("chases partially paid invoices", () => {
    const { candidates } = run({
      documents: [invoice({ status: "partially_paid", dueDate: "2026-07-27" })],
    });

    expect(candidates).toHaveLength(1);
  });

  it("queues only the highest reached rung, not one row per rung", () => {
    // 25 days overdue clears rung 0 (3d) and rung 1 (10d) but not rung 2 (21d)... it does clear 21d.
    // due 2026-07-05 => 25 days overdue => highest reached rung is 2 (21d).
    const { candidates } = run({ documents: [invoice({ dueDate: "2026-07-05" })] });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].rung).toBe(2);
  });

  it("does not backfill skipped rungs for a long-ignored invoice", () => {
    // due 2026-07-15 => 15 days overdue => rung 1 (10d) reached, rung 2 (21d) not.
    const { candidates } = run({ documents: [invoice({ dueDate: "2026-07-15" })] });

    expect(candidates.map((candidate) => candidate.rung)).toEqual([1]);
  });
});

describe("detectFollowUps — suppression", () => {
  it("does not re-queue a rung that already exists as pending", () => {
    const { candidates } = run({
      documents: [invoice({ dueDate: "2026-07-27" })],
      existing: [
        {
          triggerType: "invoice_overdue",
          subjectId: "d1",
          rung: 0,
          status: "pending",
        },
      ],
    });

    expect(candidates).toHaveLength(0);
  });

  it("keeps a dismissed rung dismissed", () => {
    const { candidates } = run({
      documents: [invoice({ dueDate: "2026-07-27" })],
      existing: [
        {
          triggerType: "invoice_overdue",
          subjectId: "d1",
          rung: 0,
          status: "dismissed",
        },
      ],
    });

    expect(candidates).toHaveLength(0);
  });

  it("does not re-queue a rung that was already sent", () => {
    const { candidates } = run({
      documents: [invoice({ dueDate: "2026-07-27" })],
      existing: [
        { triggerType: "invoice_overdue", subjectId: "d1", rung: 0, status: "sent" },
      ],
    });

    expect(candidates).toHaveLength(0);
  });

  it("queues rung 1 once reached even though rung 0 is still pending", () => {
    // due 2026-07-20 => 10 days overdue => rung 1 reached.
    const { candidates } = run({
      documents: [invoice({ dueDate: "2026-07-20" })],
      existing: [
        {
          triggerType: "invoice_overdue",
          subjectId: "d1",
          rung: 0,
          status: "pending",
        },
      ],
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].rung).toBe(1);
  });

  it("never queues a rung lower than one already recorded", () => {
    // Only rung 1 is reached, but rung 2 somehow already exists (ladder edit).
    const { candidates } = run({
      documents: [invoice({ dueDate: "2026-07-15" })],
      existing: [
        { triggerType: "invoice_overdue", subjectId: "d1", rung: 2, status: "sent" },
      ],
    });

    expect(candidates).toHaveLength(0);
  });

  it("keeps triggers independent across the same subject", () => {
    // An overdue invoice with a dismissed due_soon rung still queues overdue.
    const { candidates } = run({
      documents: [invoice({ dueDate: "2026-07-27" })],
      existing: [
        {
          triggerType: "invoice_due_soon",
          subjectId: "d1",
          rung: 0,
          status: "dismissed",
        },
      ],
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].triggerType).toBe("invoice_overdue");
  });
});

describe("detectFollowUps — invoice_due_soon", () => {
  it("fires three days before the due date", () => {
    const { candidates } = run({ documents: [invoice({ dueDate: "2026-08-02" })] });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      triggerType: "invoice_due_soon",
      rung: 0,
    });
    expect(candidates[0].facts).toEqual({
      documentNumber: "INV-0007",
      documentType: "invoice",
      currency: "AED",
      amount: 4200,
      daysUntilDue: 3,
    });
  });

  it("does not fire four days before the due date", () => {
    const { candidates } = run({ documents: [invoice({ dueDate: "2026-08-03" })] });

    expect(candidates).toHaveLength(0);
  });

  it("fires on the due date itself", () => {
    const { candidates } = run({ documents: [invoice({ dueDate: "2026-07-30" })] });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].triggerType).toBe("invoice_due_soon");
    expect(candidates[0].facts.daysUntilDue).toBe(0);
  });

  it("stops firing once the invoice is past due", () => {
    // 1 day overdue: too early for invoice_overdue, too late for due_soon.
    const { candidates } = run({ documents: [invoice({ dueDate: "2026-07-29" })] });

    expect(candidates).toHaveLength(0);
  });

  it("never emits due_soon and overdue for the same invoice", () => {
    const { candidates } = run({
      documents: [
        invoice({ id: "d1", dueDate: "2026-07-05" }),
        invoice({ id: "d3", dueDate: "2026-08-01" }),
      ],
    });

    const byDocument = new Map<string, string[]>();
    for (const candidate of candidates) {
      const list = byDocument.get(candidate.subjectId) ?? [];
      list.push(candidate.triggerType);
      byDocument.set(candidate.subjectId, list);
    }

    for (const triggers of byDocument.values()) {
      expect(triggers).toHaveLength(1);
    }
  });
});

describe("detectFollowUps — document_unanswered", () => {
  it("fires five days after a proposal was sent", () => {
    const { candidates } = run({
      documents: [proposal({ sentAt: "2026-07-25T09:00:00.000Z" })],
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      triggerType: "document_unanswered",
      subjectType: "document",
      subjectId: "d2",
      rung: 0,
    });
    expect(candidates[0].facts).toEqual({
      documentNumber: "PRO-0003",
      documentType: "proposal",
      currency: "AED",
      amount: 9000,
      daysSinceSent: 5,
    });
  });

  it("covers quotes as well as proposals", () => {
    const { candidates } = run({
      documents: [
        proposal({ type: "quote", number: "QUO-0001", sentAt: "2026-07-25T09:00:00.000Z" }),
      ],
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].facts.documentType).toBe("quote");
  });

  it("escalates to rung 1 after fourteen days", () => {
    const { candidates } = run({
      documents: [proposal({ sentAt: "2026-07-16T09:00:00.000Z" })],
    });

    expect(candidates[0].rung).toBe(1);
  });

  it("ignores approved proposals", () => {
    const { candidates } = run({
      documents: [
        proposal({ status: "approved", sentAt: "2026-07-01T09:00:00.000Z" }),
      ],
    });

    expect(candidates).toHaveLength(0);
  });

  it("ignores declined quotes", () => {
    const { candidates } = run({
      documents: [
        proposal({ type: "quote", status: "declined", sentAt: "2026-07-01T09:00:00.000Z" }),
      ],
    });

    expect(candidates).toHaveLength(0);
  });

  it("counts a viewed-but-unanswered proposal", () => {
    const { candidates } = run({
      documents: [proposal({ status: "viewed", sentAt: "2026-07-25T09:00:00.000Z" })],
    });

    expect(candidates).toHaveLength(1);
  });

  it("falls back to updated_at when sent_at is missing", () => {
    const { candidates } = run({
      documents: [
        proposal({ sentAt: null, updatedAt: "2026-07-25T09:00:00.000Z" }),
      ],
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].facts.daysSinceSent).toBe(5);
  });

  it("never treats an invoice as unanswered", () => {
    const { candidates } = run({
      documents: [invoice({ status: "sent", dueDate: null, sentAt: "2026-07-01T09:00:00.000Z" })],
    });

    expect(candidates).toHaveLength(0);
  });
});

describe("detectFollowUps — project_stale", () => {
  it("fires after fourteen idle days", () => {
    const { candidates } = run({
      projects: [project({ updatedAt: "2026-07-16T09:00:00.000Z" })],
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      triggerType: "project_stale",
      subjectType: "project",
      subjectId: "p1",
      clientId: "c1",
      rung: 0,
    });
    expect(candidates[0].facts).toEqual({
      projectTitle: "Brand Refresh",
      daysIdle: 14,
    });
  });

  it("does not fire at thirteen idle days", () => {
    const { candidates } = run({
      projects: [project({ updatedAt: "2026-07-17T09:00:00.000Z" })],
    });

    expect(candidates).toHaveLength(0);
  });

  it("treats newer task activity as activity on the project", () => {
    const { candidates } = run({
      projects: [
        project({
          updatedAt: "2026-07-01T09:00:00.000Z",
          lastTaskActivityAt: "2026-07-29T09:00:00.000Z",
        }),
      ],
    });

    expect(candidates).toHaveLength(0);
  });

  it("ignores task activity older than the project itself", () => {
    const { candidates } = run({
      projects: [
        project({
          updatedAt: "2026-07-16T09:00:00.000Z",
          lastTaskActivityAt: "2026-07-01T09:00:00.000Z",
        }),
      ],
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].facts.daysIdle).toBe(14);
  });

  it("skips projects with no client — there is nobody to email", () => {
    const { candidates } = run({
      projects: [project({ clientId: null, updatedAt: "2026-06-01T09:00:00.000Z" })],
    });

    expect(candidates).toHaveLength(0);
  });

  it("skips projects that are not active", () => {
    for (const status of ["planning", "on_hold", "completed", "archived"]) {
      const { candidates } = run({
        projects: [project({ status, updatedAt: "2026-06-01T09:00:00.000Z" })],
      });

      expect(candidates).toHaveLength(0);
    }
  });

  it("escalates to rung 1 after thirty idle days", () => {
    const { candidates } = run({
      projects: [project({ updatedAt: "2026-06-30T09:00:00.000Z" })],
    });

    expect(candidates[0].rung).toBe(1);
  });
});

describe("detectFollowUps — resolutions", () => {
  it("resolves a pending row whose invoice got paid", () => {
    const { resolutions } = run({
      documents: [invoice({ status: "paid", dueDate: "2026-07-05" })],
      existing: [
        {
          triggerType: "invoice_overdue",
          subjectId: "d1",
          rung: 0,
          status: "pending",
        },
      ],
    });

    expect(resolutions).toEqual([
      { subjectId: "d1", triggerType: "invoice_overdue" },
    ]);
  });

  it("resolves a pending row whose invoice balance dropped to zero", () => {
    const { resolutions } = run({
      documents: [invoice({ amount: 0, dueDate: "2026-07-05" })],
      existing: [
        {
          triggerType: "invoice_overdue",
          subjectId: "d1",
          rung: 0,
          status: "pending",
        },
      ],
    });

    expect(resolutions).toHaveLength(1);
  });

  it("resolves a pending row whose subject vanished", () => {
    const { resolutions } = run({
      existing: [
        {
          triggerType: "invoice_overdue",
          subjectId: "gone",
          rung: 1,
          status: "pending",
        },
      ],
    });

    expect(resolutions).toEqual([
      { subjectId: "gone", triggerType: "invoice_overdue" },
    ]);
  });

  it("resolves a pending proposal nudge once the proposal is approved", () => {
    const { resolutions } = run({
      documents: [proposal({ status: "approved" })],
      existing: [
        {
          triggerType: "document_unanswered",
          subjectId: "d2",
          rung: 0,
          status: "pending",
        },
      ],
    });

    expect(resolutions).toHaveLength(1);
  });

  it("resolves a pending project nudge once the project moves again", () => {
    const { resolutions } = run({
      projects: [
        project({
          updatedAt: "2026-07-01T09:00:00.000Z",
          lastTaskActivityAt: "2026-07-29T09:00:00.000Z",
        }),
      ],
      existing: [
        { triggerType: "project_stale", subjectId: "p1", rung: 0, status: "pending" },
      ],
    });

    expect(resolutions).toHaveLength(1);
  });

  it("resolves a pending due_soon nudge once the invoice goes overdue", () => {
    const { resolutions } = run({
      documents: [invoice({ dueDate: "2026-07-20" })],
      existing: [
        {
          triggerType: "invoice_due_soon",
          subjectId: "d1",
          rung: 0,
          status: "pending",
        },
      ],
    });

    expect(resolutions).toEqual([
      { subjectId: "d1", triggerType: "invoice_due_soon" },
    ]);
  });

  it("leaves a still-valid pending row alone", () => {
    const { resolutions } = run({
      documents: [invoice({ dueDate: "2026-07-05" })],
      existing: [
        {
          triggerType: "invoice_overdue",
          subjectId: "d1",
          rung: 0,
          status: "pending",
        },
      ],
    });

    expect(resolutions).toHaveLength(0);
  });

  it("never resolves rows that are not pending", () => {
    const { resolutions } = run({
      documents: [invoice({ status: "paid", dueDate: "2026-07-05" })],
      existing: [
        { triggerType: "invoice_overdue", subjectId: "d1", rung: 0, status: "sent" },
        {
          triggerType: "invoice_overdue",
          subjectId: "d1",
          rung: 1,
          status: "dismissed",
        },
      ],
    });

    expect(resolutions).toHaveLength(0);
  });

  it("emits one resolution per subject and trigger, not per rung", () => {
    const { resolutions } = run({
      documents: [invoice({ status: "paid", dueDate: "2026-07-05" })],
      existing: [
        {
          triggerType: "invoice_overdue",
          subjectId: "d1",
          rung: 0,
          status: "pending",
        },
        {
          triggerType: "invoice_overdue",
          subjectId: "d1",
          rung: 1,
          status: "pending",
        },
      ],
    });

    expect(resolutions).toHaveLength(1);
  });
});

describe("detectFollowUps — date handling", () => {
  it("compares whole UTC calendar days regardless of time of day", () => {
    // Due date is "today" at every hour of the day => 0 days overdue, never -1 or +1.
    for (const hour of ["00:00:00", "09:00:00", "23:59:59"]) {
      const { candidates } = run({
        documents: [invoice({ dueDate: "2026-07-30" })],
        nowIso: `2026-07-30T${hour}.000Z`,
      });

      expect(candidates).toHaveLength(1);
      expect(candidates[0].facts.daysUntilDue).toBe(0);
    }
  });

  it("handles a month boundary without drifting a day", () => {
    // due 2026-06-30, now 2026-07-30 => 30 days overdue => rung 2.
    const { candidates } = run({
      documents: [invoice({ dueDate: "2026-06-30" })],
    });

    expect(candidates[0].facts.daysOverdue).toBe(30);
    expect(candidates[0].rung).toBe(2);
  });
});
