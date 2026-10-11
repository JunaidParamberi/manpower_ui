import { describe, it, expect } from "vitest";

import { draftActionLabel, followUpReason, TONE_LABEL } from "./display";

describe("followUpReason", () => {
  it("describes an overdue invoice with number, money, and lateness", () => {
    const reason = followUpReason("invoice_overdue", {
      documentNumber: "INV-0007",
      documentType: "invoice",
      currency: "AED",
      amount: 4200,
      daysOverdue: 12,
    });

    expect(reason).toBe("Invoice INV-0007 · AED 4,200 · 12 days overdue");
  });

  it("singularizes a one-day lateness", () => {
    const reason = followUpReason("invoice_overdue", {
      documentNumber: "INV-1",
      documentType: "invoice",
      currency: "AED",
      amount: 100,
      daysOverdue: 1,
    });

    expect(reason).toContain("1 day overdue");
    expect(reason).not.toContain("1 days");
  });

  it("says due today rather than due in 0 days", () => {
    const reason = followUpReason("invoice_due_soon", {
      documentNumber: "INV-9",
      documentType: "invoice",
      currency: "USD",
      amount: 500,
      daysUntilDue: 0,
    });

    expect(reason).toBe("Invoice INV-9 · USD 500 · due today");
  });

  it("counts down to a due date", () => {
    const reason = followUpReason("invoice_due_soon", {
      documentNumber: "INV-9",
      documentType: "invoice",
      currency: "USD",
      amount: 500,
      daysUntilDue: 3,
    });

    expect(reason).toContain("due in 3 days");
  });

  it("names the document type for an unanswered quote", () => {
    const reason = followUpReason("document_unanswered", {
      documentNumber: "QUO-0002",
      documentType: "quote",
      currency: "GBP",
      amount: 1500,
      daysSinceSent: 5,
    });

    expect(reason).toBe("Quote QUO-0002 · no reply in 5 days");
  });

  it("names a proposal as a proposal", () => {
    const reason = followUpReason("document_unanswered", {
      documentNumber: "PRO-0001",
      documentType: "proposal",
      daysSinceSent: 14,
    });

    expect(reason).toContain("Proposal PRO-0001");
  });

  it("describes a stale project by title and idle time", () => {
    const reason = followUpReason("project_stale", {
      projectTitle: "Brand Refresh",
      daysIdle: 21,
    });

    expect(reason).toBe("Brand Refresh · quiet for 21 days");
  });

  it("survives a snapshot missing its fields instead of printing undefined", () => {
    const reason = followUpReason("invoice_overdue", {});

    expect(reason).not.toContain("undefined");
    expect(reason).not.toContain("NaN");
    expect(reason).toContain("Invoice");
  });

  it("omits the currency prefix when the snapshot has no currency", () => {
    const reason = followUpReason("invoice_overdue", {
      documentNumber: "INV-3",
      documentType: "invoice",
      amount: 900,
      daysOverdue: 4,
    });

    expect(reason).toBe("Invoice INV-3 · 900 · 4 days overdue");
  });
});

describe("draftActionLabel", () => {
  it("calls a stale-project nudge a check-in, not a reminder", () => {
    expect(draftActionLabel("project_stale")).toBe("Draft check-in");
  });

  it("calls money chasing a reminder", () => {
    expect(draftActionLabel("invoice_overdue")).toBe("Draft reminder");
    expect(draftActionLabel("invoice_due_soon")).toBe("Draft reminder");
    expect(draftActionLabel("document_unanswered")).toBe("Draft reminder");
  });
});

describe("TONE_LABEL", () => {
  it("labels every tone", () => {
    expect(TONE_LABEL.friendly).toBe("Friendly");
    expect(TONE_LABEL.firm).toBe("Firm");
    expect(TONE_LABEL.formal).toBe("Formal");
  });
});
