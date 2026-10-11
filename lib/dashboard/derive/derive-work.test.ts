// lib/dashboard/derive/derive-work.test.ts
import { describe, expect, it } from "vitest";

import { deriveWork, type WorkDocumentInput, type WorkProjectInput } from "@/lib/dashboard/derive/derive-work";

const NOW = "2026-09-13T09:00:00.000Z";

function project(partial: Partial<WorkProjectInput> = {}): WorkProjectInput {
  return {
    id: "p1",
    title: "Brand refresh",
    status: "active",
    deadline: "2026-09-20",
    budget: 10000,
    spent: 2000,
    expenseTotal: 0,
    clientName: "Maple Co.",
    ...partial,
  };
}

function document(partial: Partial<WorkDocumentInput> = {}): WorkDocumentInput {
  return {
    id: "d1",
    title: "Website redesign",
    type: "quote",
    status: "draft",
    createdAt: "2026-09-05T00:00:00.000Z",
    sentAt: null,
    approvedAt: null,
    convertedInvoiceId: null,
    total: 5000,
    currency: "AED",
    clientName: "Acme Design Co.",
    ...partial,
  };
}

describe("deriveWork", () => {
  it("shows projects when the user has any active work", () => {
    const work = deriveWork({ nowIso: NOW, projects: [project()], documents: [document()] });
    expect(work.kind).toBe("projects");
  });

  it("falls back to documents in flight when there are no projects", () => {
    const work = deriveWork({ nowIso: NOW, projects: [], documents: [document()] });
    expect(work.kind).toBe("documents");
  });

  it("prefers linked expenses over the manually typed spend", () => {
    const work = deriveWork({
      nowIso: NOW,
      projects: [project({ spent: 2000, expenseTotal: 3500 })],
      documents: [],
    });
    if (work.kind !== "projects") throw new Error("expected projects");
    expect(work.projects[0].spent).toBe(3500);
    expect(work.projects[0].progress).toBeCloseTo(0.35);
  });

  it("classifies documents into the stage they are actually stuck at", () => {
    const work = deriveWork({
      nowIso: NOW,
      projects: [],
      documents: [
        document({ id: "draft", status: "draft" }),
        document({ id: "sent", status: "sent", sentAt: "2026-09-06T00:00:00.000Z" }),
        document({
          id: "approved",
          status: "approved",
          sentAt: "2026-09-01T00:00:00.000Z",
          approvedAt: "2026-09-08T00:00:00.000Z",
        }),
      ],
    });
    if (work.kind !== "documents") throw new Error("expected documents");
    expect(work.documents.map((d) => [d.id, d.stage])).toEqual([
      ["approved", "awaiting_invoice"],
      ["sent", "awaiting_reply"],
      ["draft", "draft"],
    ]);
  });

  it("excludes an approved quote that already became an invoice", () => {
    const work = deriveWork({
      nowIso: NOW,
      projects: [],
      documents: [
        document({ status: "approved", approvedAt: "2026-09-08T00:00:00.000Z", convertedInvoiceId: "inv-1" }),
      ],
    });
    if (work.kind !== "documents") throw new Error("expected documents");
    expect(work.documents).toEqual([]);
  });

  it("reports the total count even when the list is capped", () => {
    const projects = Array.from({ length: 9 }, (_, i) => project({ id: `p${i}` }));
    const work = deriveWork({ nowIso: NOW, projects, documents: [], limit: 5 });
    if (work.kind !== "projects") throw new Error("expected projects");
    expect(work.projects).toHaveLength(5);
    expect(work.totalCount).toBe(9);
  });
});
