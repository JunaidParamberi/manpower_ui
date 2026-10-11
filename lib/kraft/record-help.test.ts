import { describe, expect, it } from "vitest";

import {
  MAX_HELP_ITEMS,
  clientHelp,
  documentHelp,
  issueCount,
  projectHelp,
  projectHelpFromData,
  type DocumentHelpInput,
} from "./record-help";

const draftInvoice: DocumentHelpInput = {
  type: "invoice",
  status: "draft",
  label: "INV-0007",
  hasClient: true,
  lineItemCount: 3,
  allZeroPriced: false,
  dueDate: "2026-10-22",
  validUntil: null,
  balance: 11500,
  today: "2026-10-08",
};

describe("documentHelp", () => {
  it("offers a check and a summary on a complete draft, with no issues", () => {
    const help = documentHelp(draftInvoice);
    expect(issueCount(help)).toBe(0);
    expect(help.items.map((i) => i.id)).toEqual(["check", "summary"]);
    expect(help.label).toBe("INV-0007");
  });

  it("flags a missing due date first", () => {
    const help = documentHelp({ ...draftInvoice, dueDate: null });
    expect(help.items[0]).toMatchObject({ id: "no-due-date", tone: "issue", mode: "agent" });
    expect(issueCount(help)).toBe(1);
  });

  it("flags a missing client and zero prices on a draft", () => {
    const help = documentHelp({ ...draftInvoice, hasClient: false, allZeroPriced: true });
    expect(help.items.slice(0, 2).map((i) => i.id)).toEqual(["no-client", "zero-prices"]);
  });

  it("asks for line items instead of prices when there are none", () => {
    const ids = documentHelp({ ...draftInvoice, lineItemCount: 0, allZeroPriced: true }).items.map((i) => i.id);
    expect(ids).toContain("no-items");
    expect(ids).not.toContain("zero-prices");
  });

  it("doesn't nag about editing a sent document", () => {
    const help = documentHelp({ ...draftInvoice, status: "sent", hasClient: false, allZeroPriced: true });
    expect(help.items.map((i) => i.id)).not.toContain("no-client");
    expect(help.items.map((i) => i.id)).not.toContain("check");
  });

  it("offers a reminder on an overdue invoice with a balance", () => {
    const help = documentHelp({ ...draftInvoice, status: "sent", dueDate: "2026-10-01" });
    expect(help.items[0]).toMatchObject({ id: "overdue", detail: "7 days overdue" });
  });

  it("does not call a fully paid-off invoice overdue", () => {
    const help = documentHelp({ ...draftInvoice, status: "partially_paid", dueDate: "2026-10-01", balance: 0 });
    expect(help.items.map((i) => i.id)).not.toContain("overdue");
  });

  it("asks for a valid-until date on a draft quote", () => {
    const help = documentHelp({ ...draftInvoice, type: "quote", label: "QUO-0012", dueDate: null });
    expect(help.items[0].id).toBe("no-valid-until");
    expect(help.items.map((i) => i.id)).not.toContain("no-due-date");
  });

  it("offers to convert an approved quote and thank a paid invoice", () => {
    expect(documentHelp({ ...draftInvoice, type: "quote", status: "approved" }).items.map((i) => i.id)).toContain(
      "to-invoice",
    );
    expect(documentHelp({ ...draftInvoice, status: "paid" }).items.map((i) => i.id)).toContain("thanks");
  });

  it("never shows more than the maximum", () => {
    const help = documentHelp({ ...draftInvoice, hasClient: false, allZeroPriced: true, dueDate: null });
    expect(help.items.length).toBeLessThanOrEqual(MAX_HELP_ITEMS);
    expect(help.items.slice(0, 3).every((i) => i.tone === "issue")).toBe(true);
  });
});

describe("clientHelp", () => {
  it("turns warning signals into issues with a matching prompt", () => {
    const help = clientHelp({
      name: "Bright Apps Ltd",
      contactName: "Tom Webb",
      healthScore: 60,
      signals: [
        { kind: "no_active_work", severity: "warning", title: "No active work", detail: "Nothing since 8 Aug" },
        { kind: "slow_payer", severity: "info", title: "Pays a little late", detail: "" },
      ],
    });
    expect(issueCount(help)).toBe(1);
    expect(help.items[0]).toMatchObject({ id: "no_active_work", title: "No active work", mode: "agent" });
    expect(help.items[0].prompt).toContain("Tom Webb");
    expect(help.items.map((i) => i.id)).toContain("explain-health");
  });

  it("offers ideas for a healthy client", () => {
    const help = clientHelp({ name: "Nova Retail", contactName: null, healthScore: 95, signals: [] });
    expect(issueCount(help)).toBe(0);
    expect(help.items.map((i) => i.id)).toEqual(["summary", "new-quote"]);
  });
});

describe("projectHelp", () => {
  it("leads with risk signals and offers a status update while active", () => {
    const help = projectHelp({
      title: "Landing Page",
      status: "active",
      signals: [{ kind: "deadline_risk", severity: "critical", title: "Deadline at risk", detail: "7 days left, 4 tasks open" }],
    });
    expect(help.items[0]).toMatchObject({ id: "deadline_risk", tone: "issue", mode: "agent" });
    expect(help.items.map((i) => i.id)).toContain("status-update");
  });

  it("skips the status update on a finished project", () => {
    const help = projectHelp({ title: "Old site", status: "completed", signals: [] });
    expect(help.items.map((i) => i.id)).toEqual(["invoice-work", "summary"]);
  });
});

describe("prompts name the record", () => {
  it("names the document, client and project instead of saying 'this'", () => {
    const doc = documentHelp({ ...draftInvoice, label: "INV-0008", hasClient: false });
    expect(doc.items[0].prompt).toMatch(/^Invoice INV-0008 has no client\. Work out which client/);
    expect(doc.items.every((i) => !i.prompt.includes("this invoice"))).toBe(true);

    const client = clientHelp({ name: "Bright Apps Ltd", contactName: null, healthScore: 95, signals: [] });
    expect(client.items[0].prompt).toContain('the client "Bright Apps Ltd"');

    const project = projectHelp({ title: "Landing Page", status: "active", signals: [] });
    expect(project.items.every((i) => i.prompt.includes('"Landing Page"'))).toBe(true);
  });
});

describe("projectHelpFromData", () => {
  it("flags a near deadline with most tasks open", () => {
    const help = projectHelpFromData({
      project: {
        id: "p1",
        title: "Landing Page",
        status: "active",
        deadline: "2026-10-10",
        budget: 6000,
        spent: null,
        updated_at: "2026-09-20T00:00:00Z",
      },
      tasks: [
        { id: "t1", status: "done", due_date: null, updated_at: "2026-09-20T00:00:00Z" },
        { id: "t2", status: "todo", due_date: null, updated_at: "2026-09-20T00:00:00Z" },
        { id: "t3", status: "todo", due_date: null, updated_at: "2026-09-20T00:00:00Z" },
        { id: "t4", status: "in_progress", due_date: null, updated_at: "2026-09-20T00:00:00Z" },
      ],
      expenses: [],
      invoices: [],
      nowIso: "2026-10-08T09:00:00Z",
      currency: "GBP",
    });
    expect(issueCount(help)).toBeGreaterThan(0);
    expect(help.items[0].tone).toBe("issue");
    expect(help.label).toBe("Landing Page");
  });

  it("has only ideas for a quiet, healthy project", () => {
    const help = projectHelpFromData({
      project: { id: "p1", title: "Site", status: "planning", deadline: null, budget: null, spent: null, updated_at: "2026-10-07T00:00:00Z" },
      tasks: [],
      expenses: [],
      invoices: [],
      nowIso: "2026-10-08T09:00:00Z",
      currency: "GBP",
    });
    expect(issueCount(help)).toBe(0);
  });
});
