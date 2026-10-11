import { describe, expect, it } from "vitest";
import {
  buildClientHealthFacts,
  daysBetweenIso,
  detectGoneQuiet,
  detectNoActiveWork,
  detectOverdueInvoices,
  detectRevenueDecline,
  detectSlowPayer,
  detectStalledPipeline,
  scoreClientHealth,
  type HealthBand,
  type HealthDocumentTouchInput,
  type HealthInvoiceInput,
  type HealthProjectInput,
  type HealthSignal,
} from "./health-facts";
import { healthPresentation } from "./display";

const NOW = "2026-07-31T00:00:00.000Z";

describe("daysBetweenIso", () => {
  it("counts whole calendar days forward", () => {
    expect(daysBetweenIso("2026-07-01", "2026-07-31")).toBe(30);
  });
  it("is negative when toIso is earlier", () => {
    expect(daysBetweenIso("2026-07-31", "2026-07-01")).toBe(-30);
  });
});

describe("detectOverdueInvoices", () => {
  it("returns null when nothing is overdue", () => {
    const invoices: HealthInvoiceInput[] = [
      { id: "1", status: "sent", dueDate: "2026-08-05", total: 500, paidAt: null, daysToPay: null },
    ];
    expect(detectOverdueInvoices(invoices, NOW)).toBeNull();
  });

  it("is a warning for one overdue invoice under 60 days", () => {
    const invoices: HealthInvoiceInput[] = [
      { id: "1", status: "sent", dueDate: "2026-07-01", total: 500, paidAt: null, daysToPay: null },
    ];
    const signal = detectOverdueInvoices(invoices, NOW);
    expect(signal?.severity).toBe("warning");
    expect(signal?.kind).toBe("overdue_invoices");
  });

  it("is critical when 2+ invoices are overdue", () => {
    const invoices: HealthInvoiceInput[] = [
      { id: "1", status: "sent", dueDate: "2026-07-01", total: 500, paidAt: null, daysToPay: null },
      { id: "2", status: "viewed", dueDate: "2026-07-10", total: 300, paidAt: null, daysToPay: null },
    ];
    expect(detectOverdueInvoices(invoices, NOW)?.severity).toBe("critical");
  });

  it("is critical when a single invoice is more than 60 days overdue", () => {
    const invoices: HealthInvoiceInput[] = [
      { id: "1", status: "sent", dueDate: "2026-05-01", total: 500, paidAt: null, daysToPay: null },
    ];
    expect(detectOverdueInvoices(invoices, NOW)?.severity).toBe("critical");
  });
});

describe("detectSlowPayer", () => {
  it("returns null when average days-to-pay is within terms + 7", () => {
    const invoices: HealthInvoiceInput[] = [
      { id: "1", status: "paid", dueDate: "2026-06-01", total: 500, paidAt: "2026-06-15", daysToPay: 15 },
    ];
    expect(detectSlowPayer(invoices, 15)).toBeNull();
  });

  it("is info when average days-to-pay exceeds terms + 7", () => {
    const invoices: HealthInvoiceInput[] = [
      { id: "1", status: "paid", dueDate: "2026-06-01", total: 500, paidAt: "2026-06-25", daysToPay: 25 },
    ];
    expect(detectSlowPayer(invoices, 15)?.severity).toBe("info");
  });

  it("is warning when average days-to-pay exceeds 2x terms", () => {
    const invoices: HealthInvoiceInput[] = [
      { id: "1", status: "paid", dueDate: "2026-06-01", total: 500, paidAt: "2026-07-01", daysToPay: 31 },
    ];
    expect(detectSlowPayer(invoices, 15)?.severity).toBe("warning");
  });

  it("only considers the last 5 paid invoices", () => {
    const invoices: HealthInvoiceInput[] = Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      status: "paid",
      dueDate: "2026-06-01",
      total: 100,
      paidAt: "2026-06-16",
      daysToPay: i === 0 ? 100 : 15,
    }));
    // The 6th-oldest (i=0, 100 days) falls outside the trailing 5 and must not skew the average.
    expect(detectSlowPayer(invoices, 15)).toBeNull();
  });

  it("selects trailing 5 by paidAt even when invoices are not pre-sorted", () => {
    const invoices: HealthInvoiceInput[] = [
      { id: "5", status: "paid", dueDate: "2026-06-01", total: 100, paidAt: "2026-06-20", daysToPay: 15 },
      { id: "0", status: "paid", dueDate: "2026-06-01", total: 100, paidAt: "2026-06-01", daysToPay: 100 }, // oldest, should be excluded
      { id: "2", status: "paid", dueDate: "2026-06-01", total: 100, paidAt: "2026-06-10", daysToPay: 15 },
      { id: "4", status: "paid", dueDate: "2026-06-01", total: 100, paidAt: "2026-06-19", daysToPay: 15 },
      { id: "1", status: "paid", dueDate: "2026-06-01", total: 100, paidAt: "2026-06-05", daysToPay: 15 },
      { id: "3", status: "paid", dueDate: "2026-06-01", total: 100, paidAt: "2026-06-15", daysToPay: 15 },
    ];
    // Should select invoices 1,2,3,4,5 (ids ordered by paidAt) with avg=15, not including id=0 with 100 days.
    // Average of 15 is within terms(15) + grace(7) = 22, so should return null.
    expect(detectSlowPayer(invoices, 15)).toBeNull();
  });
});

describe("detectGoneQuiet", () => {
  it("returns null under 45 days of silence", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-06-20T00:00:00.000Z", viewedAt: null, status: "sent", type: "invoice" },
    ];
    const projects: HealthProjectInput[] = [];
    expect(detectGoneQuiet(docs, projects, null, NOW)).toBeNull();
  });

  it("is warning between 45 and 90 days", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-06-01T00:00:00.000Z", viewedAt: null, status: "sent", type: "invoice" },
    ];
    expect(detectGoneQuiet(docs, [], null, NOW)?.severity).toBe("warning");
  });

  it("is critical past 90 days", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-01-01T00:00:00.000Z", viewedAt: null, status: "sent", type: "invoice" },
    ];
    expect(detectGoneQuiet(docs, [], null, NOW)?.severity).toBe("critical");
  });

  it("uses the most recent of documents, projects, and time entries", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-01-01T00:00:00.000Z", viewedAt: null, status: "sent", type: "invoice" },
    ];
    const projects: HealthProjectInput[] = [
      { id: "p1", status: "active", updatedAt: "2026-07-20T00:00:00.000Z" },
    ];
    expect(detectGoneQuiet(docs, projects, null, NOW)).toBeNull();
  });

  it("boundary: 44 days of silence returns null", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-06-17T00:00:00.000Z", viewedAt: null, status: "sent", type: "invoice" },
    ];
    expect(detectGoneQuiet(docs, [], null, NOW)).toBeNull();
  });

  it("boundary: 45 days of silence returns a warning signal", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-06-16T00:00:00.000Z", viewedAt: null, status: "sent", type: "invoice" },
    ];
    expect(detectGoneQuiet(docs, [], null, NOW)?.severity).toBe("warning");
  });

  it("boundary: 46 days of silence returns a signal", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-06-15T00:00:00.000Z", viewedAt: null, status: "sent", type: "invoice" },
    ];
    expect(detectGoneQuiet(docs, [], null, NOW)?.severity).toBe("warning");
  });
});

describe("detectRevenueDecline", () => {
  it("returns null when this window holds at least half of the prior window", () => {
    expect(detectRevenueDecline(600, 1000)).toBeNull();
  });

  it("is warning when this window is under half the prior window", () => {
    expect(detectRevenueDecline(400, 1000)?.severity).toBe("warning");
  });

  it("is critical when this window is zero and prior window was positive", () => {
    expect(detectRevenueDecline(0, 1000)?.severity).toBe("critical");
  });

  it("returns null when the prior window was zero (nothing to decline from)", () => {
    expect(detectRevenueDecline(0, 0)).toBeNull();
  });
});

describe("detectStalledPipeline", () => {
  it("returns null when no quote/proposal is open", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-07-01T00:00:00.000Z", viewedAt: null, status: "signed", type: "proposal" },
    ];
    expect(detectStalledPipeline(docs, NOW)).toBeNull();
  });

  it("is info between 14 and 30 days open", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-07-10T00:00:00.000Z", viewedAt: null, status: "sent", type: "quote" },
    ];
    expect(detectStalledPipeline(docs, NOW)?.severity).toBe("info");
  });

  it("is warning past 30 days open", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-06-01T00:00:00.000Z", viewedAt: null, status: "viewed", type: "proposal" },
    ];
    expect(detectStalledPipeline(docs, NOW)?.severity).toBe("warning");
  });

  it("boundary: 13 days open returns null", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-07-18T00:00:00.000Z", viewedAt: null, status: "sent", type: "quote" },
    ];
    expect(detectStalledPipeline(docs, NOW)).toBeNull();
  });

  it("boundary: 14 days open returns a signal", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-07-17T00:00:00.000Z", viewedAt: null, status: "sent", type: "quote" },
    ];
    expect(detectStalledPipeline(docs, NOW)?.severity).toBe("info");
  });

  it("boundary: 15 days open returns a signal", () => {
    const docs: HealthDocumentTouchInput[] = [
      { sentAt: "2026-07-16T00:00:00.000Z", viewedAt: null, status: "sent", type: "quote" },
    ];
    expect(detectStalledPipeline(docs, NOW)?.severity).toBe("info");
  });
});

describe("detectNoActiveWork", () => {
  it("fires when there is no active project and no unpaid invoice", () => {
    const projects: HealthProjectInput[] = [{ id: "p1", status: "completed", updatedAt: NOW }];
    const invoices: HealthInvoiceInput[] = [];
    expect(detectNoActiveWork(projects, invoices)?.severity).toBe("info");
  });

  it("returns null when there is an active project", () => {
    const projects: HealthProjectInput[] = [{ id: "p1", status: "active", updatedAt: NOW }];
    expect(detectNoActiveWork(projects, [])).toBeNull();
  });

  it("returns null when there is an unpaid invoice", () => {
    const invoices: HealthInvoiceInput[] = [
      { id: "1", status: "sent", dueDate: "2026-08-01", total: 100, paidAt: null, daysToPay: null },
    ];
    expect(detectNoActiveWork([], invoices)).toBeNull();
  });
});

describe("scoreClientHealth", () => {
  it("scores 100 / excellent with no signals", () => {
    expect(scoreClientHealth([])).toEqual({ score: 100, band: "excellent" });
  });

  it("bands match lib/clients/display.ts healthPresentation cuts", () => {
    // excellent >= 80, healthy >= 55, needs_attention >= 30, else at_risk
    expect(scoreClientHealth([{ kind: "no_active_work", severity: "info", title: "", detail: "" }])).toEqual({
      score: 95,
      band: "excellent",
    });
    expect(
      scoreClientHealth([
        { kind: "gone_quiet", severity: "warning", title: "", detail: "" },
        { kind: "slow_payer", severity: "warning", title: "", detail: "" },
      ]),
    ).toEqual({ score: 60, band: "healthy" });
    expect(
      scoreClientHealth([
        { kind: "overdue_invoices", severity: "critical", title: "", detail: "" },
        { kind: "gone_quiet", severity: "warning", title: "", detail: "" },
      ]),
    ).toEqual({ score: 40, band: "needs_attention" });
    expect(
      scoreClientHealth([
        { kind: "overdue_invoices", severity: "critical", title: "", detail: "" },
        { kind: "revenue_decline", severity: "critical", title: "", detail: "" },
      ]),
    ).toEqual({ score: 20, band: "at_risk" });
  });

  it("floors at 0", () => {
    const signals = Array.from({ length: 5 }, () => ({
      kind: "overdue_invoices" as const,
      severity: "critical" as const,
      title: "",
      detail: "",
    }));
    expect(scoreClientHealth(signals).score).toBe(0);
  });

  it("band cuts never drift from lib/clients/display.ts healthPresentation()", () => {
    // Severity weights (5/20/40) mean scoreClientHealth's score is always a
    // multiple of 5, so the achievable scores nearest each documented
    // boundary (79/80, 54/55, 29/30) are the pairs below. Each "info"
    // signal subtracts exactly 5, so N info signals produce score = 100 - 5N.
    const bandToLabel: Record<HealthBand, string> = {
      excellent: "Excellent health",
      healthy: "Healthy",
      needs_attention: "Needs attention",
      at_risk: "At risk",
    };

    const infoSignals = (count: number): HealthSignal[] =>
      Array.from({ length: count }, () => ({
        kind: "no_active_work" as const,
        severity: "info" as const,
        title: "",
        detail: "",
      }));

    // score 80 (excellent) vs 75 (healthy) — straddles the 80 cut.
    // score 55 (healthy) vs 50 (needs_attention) — straddles the 55 cut.
    // score 30 (needs_attention) vs 25 (at_risk) — straddles the 30 cut.
    const cases = [4, 5, 9, 10, 14, 15];

    for (const infoCount of cases) {
      const { score, band } = scoreClientHealth(infoSignals(infoCount));
      const presentation = healthPresentation(score);
      expect(presentation).not.toBeNull();
      expect(bandToLabel[band]).toBe(presentation?.label);
    }
  });
});

describe("buildClientHealthFacts", () => {
  const client = {
    id: "c1",
    name: "Acme",
    relationshipStatus: "active",
    paymentTermsDays: 15,
  };

  it("returns null when there is no paid invoice, no sent document, and no project", () => {
    const facts = buildClientHealthFacts({
      client,
      invoices: [],
      documents: [],
      projects: [],
      revenueLast90: 0,
      revenuePrior90: 0,
      nowIso: NOW,
    });
    expect(facts).toBeNull();
  });

  it("returns null for past/archived relationship status", () => {
    const facts = buildClientHealthFacts({
      client: { ...client, relationshipStatus: "past" },
      invoices: [{ id: "1", status: "paid", dueDate: "2026-06-01", total: 500, paidAt: "2026-06-05", daysToPay: 4 }],
      documents: [],
      projects: [],
      revenueLast90: 500,
      revenuePrior90: 500,
      nowIso: NOW,
    });
    expect(facts).toBeNull();
  });

  it("returns a clean 100/excellent facts object for a healthy client with history", () => {
    const facts = buildClientHealthFacts({
      client,
      invoices: [{ id: "1", status: "paid", dueDate: "2026-06-01", total: 500, paidAt: "2026-06-05", daysToPay: 4 }],
      documents: [],
      projects: [{ id: "p1", status: "active", updatedAt: NOW }],
      revenueLast90: 500,
      revenuePrior90: 500,
      nowIso: NOW,
    });
    expect(facts).toEqual({ clientId: "c1", score: 100, band: "excellent", signals: [], computedAt: NOW });
  });

  it("orders signals by severity descending, not detection order", () => {
    // Detection order is overdue -> slow_payer -> gone_quiet -> revenue_decline
    // -> stalled_pipeline -> no_active_work. Trigger slow_payer (info,
    // detected 2nd) and revenue_decline (critical, detected 4th) so a naive
    // "return signals in detection order" bug would list info before
    // critical instead of the other way around.
    const facts = buildClientHealthFacts({
      client,
      invoices: [
        {
          id: "1",
          status: "paid",
          dueDate: "2026-06-01",
          total: 500,
          paidAt: "2026-06-25",
          daysToPay: 24,
        },
      ],
      documents: [],
      projects: [{ id: "p1", status: "active", updatedAt: NOW }],
      revenueLast90: 0,
      revenuePrior90: 1000,
      nowIso: NOW,
    });
    expect(facts?.signals.map((s) => s.kind)).toEqual(["revenue_decline", "slow_payer"]);
    expect(facts?.signals[0]?.severity).toBe("critical");
  });
});
