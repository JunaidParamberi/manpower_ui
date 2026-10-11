import { describe, expect, it } from "vitest";

import {
  buildDocumentNotificationPayload,
  buildTaskNotificationPayload,
} from "./build-payload";

const base = {
  id: "doc-1",
  type: "invoice" as const,
  title: "Untitled",
  invoice_number: "INV-0001",
  quote_number: null,
  proposal_number: null,
  clientName: "Acme Corp",
};

describe("buildDocumentNotificationPayload", () => {
  it("puts the event in the title and client + amount in the body", () => {
    const p = buildDocumentNotificationPayload("invoice_paid", {
      ...base,
      amount: 1500,
    });
    expect(p.title).toBe("Invoice #INV-0001 paid");
    expect(p.body).toContain("Acme Corp");
    expect(p.body).toContain("1,500");
    expect(p.href).toBe("/documents/doc-1");
    expect(p.entity_id).toBe("doc-1");
  });

  it("keeps the client in the body when there is no amount", () => {
    const p = buildDocumentNotificationPayload("invoice_paid", {
      ...base,
      amount: null,
    });
    expect(p.title).toBe("Invoice #INV-0001 paid");
    expect(p.body).toBe("Acme Corp");
  });

  it("omits body rather than padding it when the document has no client", () => {
    const p = buildDocumentNotificationPayload("quote_approved", {
      ...base,
      type: "quote",
      quote_number: "QUO-0002",
      invoice_number: null,
      clientName: null,
    });
    expect(p.title).toBe("Quote #QUO-0002 approved");
    expect(p.body).toBeUndefined();
  });

  it("builds quote_approved title and body", () => {
    const p = buildDocumentNotificationPayload("quote_approved", {
      ...base,
      type: "quote",
      quote_number: "QUO-0002",
      invoice_number: null,
    });
    expect(p.title).toBe("Quote #QUO-0002 approved");
    expect(p.body).toBe("Acme Corp");
  });

  it("names the recipient in the body for doc_sent", () => {
    const p = buildDocumentNotificationPayload("doc_sent", base);
    expect(p.title).toBe("Invoice #INV-0001 sent");
    expect(p.body).toBe("To Acme Corp");
  });
});

describe("buildTaskNotificationPayload", () => {
  const task = {
    id: "task-1",
    title: "Write proposal",
    projectId: "proj-1",
    projectTitle: "Brand Refresh",
  };

  it("titles with the task and puts due state + project in the body", () => {
    const p = buildTaskNotificationPayload("task_due", task);
    expect(p.title).toBe("Write proposal");
    expect(p.body).toBe("Due today · Brand Refresh");
    expect(p.href).toBe("/projects/proj-1?tab=tasks");
    expect(p.entity_id).toBe("task-1");
  });

  it("marks an overdue task in the body", () => {
    const p = buildTaskNotificationPayload("task_overdue", task);
    expect(p.title).toBe("Write proposal");
    expect(p.body).toBe("Overdue · Brand Refresh");
    expect(p.href).toBe("/projects/proj-1?tab=tasks");
  });

  it("falls back to /tasks when no project", () => {
    const p = buildTaskNotificationPayload("task_due", {
      ...task,
      projectId: null,
      projectTitle: null,
    });
    expect(p.href).toBe("/tasks");
    expect(p.body).toBe("Due today");
  });

  it("omits project suffix when projectTitle is null", () => {
    const p = buildTaskNotificationPayload("task_overdue", {
      ...task,
      projectTitle: null,
    });
    expect(p.body).toBe("Overdue");
  });
});
