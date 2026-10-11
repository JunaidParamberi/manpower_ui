import { describe, expect, it } from "vitest";

import { openDocuments, openProjects } from "./client-open-items";

describe("openProjects", () => {
  it("keeps planning, active and on-hold projects, soonest deadline first, undated last", () => {
    const result = openProjects([
      { id: "a", status: "completed", deadline: "2026-10-01" },
      { id: "b", status: "active", deadline: null },
      { id: "c", status: "active", deadline: "2026-11-01" },
      { id: "d", status: "planning", deadline: "2026-10-15" },
      { id: "e", status: "archived", deadline: "2026-10-02" },
      { id: "f", status: "on_hold", deadline: "2026-12-01" },
    ]);
    expect(result.map((p) => p.id)).toEqual(["d", "c", "f", "b"]);
  });
  it("respects the limit", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ id: String(i), status: "active" as const, deadline: null }));
    expect(openProjects(many, 5)).toHaveLength(5);
  });
});

describe("openDocuments", () => {
  it("keeps unpaid invoices and sent quotes/proposals, earliest due first", () => {
    const result = openDocuments([
      { id: "paid", type: "invoice", status: "paid", due_date: "2026-09-01", created_at: "2026-08-01" },
      { id: "draft", type: "invoice", status: "draft", due_date: null, created_at: "2026-10-01" },
      { id: "late", type: "invoice", status: "sent", due_date: "2026-09-20", created_at: "2026-09-01" },
      { id: "part", type: "invoice", status: "partially_paid", due_date: "2026-10-20", created_at: "2026-09-10" },
      { id: "quote", type: "quote", status: "viewed", due_date: null, created_at: "2026-10-03" },
      { id: "approved", type: "quote", status: "approved", due_date: null, created_at: "2026-10-04" },
      { id: "rcpt", type: "receipt", status: "sent", due_date: null, created_at: "2026-10-05" },
    ]);
    expect(result.map((d) => d.id)).toEqual(["late", "part", "quote"]);
  });
});
