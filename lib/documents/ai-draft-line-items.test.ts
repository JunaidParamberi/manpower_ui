import { describe, it, expect } from "vitest";
import { applyAiDraftToLineItemRows, draftNotesFooter } from "./ai-draft-line-items";
import type { DocumentDraftResult } from "@/lib/ai/document-writer-result";

const base: DocumentDraftResult = {
  title: "Website redesign",
  docType: "quote",
  lineItems: [
    { description: "Design", quantity: 2, unitPrice: 500 },
    { description: "Build", quantity: 1, unitPrice: 1500 },
  ],
  terms: "50% upfront",
  notes: "",
  clientMatchStatus: "matched",
  matchedClientId: "c1",
  currency: "USD",
};

describe("applyAiDraftToLineItemRows", () => {
  it("maps line items with sequential sort_order", () => {
    const rows = applyAiDraftToLineItemRows(base);
    expect(rows).toEqual([
      { description: "Design", quantity: 2, unit_price: 500, tax_rate: 0, sort_order: 0 },
      { description: "Build", quantity: 1, unit_price: 1500, tax_rate: 0, sort_order: 1 },
    ]);
  });

  it("returns [] for proposals (no line-item editor)", () => {
    expect(applyAiDraftToLineItemRows({ ...base, docType: "proposal" })).toEqual([]);
  });

  it("maps invoices too", () => {
    expect(applyAiDraftToLineItemRows({ ...base, docType: "invoice" })).toHaveLength(2);
  });
});

describe("applyAiDraftToLineItemRows tax", () => {
  it("carries a line's tax rate from a source document", () => {
    const rows = applyAiDraftToLineItemRows({
      ...base,
      docType: "invoice",
      lineItems: [{ description: "Design", quantity: 1, unitPrice: 800, taxRate: 5 }],
    });
    expect(rows[0].tax_rate).toBe(5);
  });
});

describe("draftNotesFooter", () => {
  it("joins terms and notes, skipping blanks", () => {
    expect(draftNotesFooter({ terms: "Due in 14 days", notes: "Thanks!" })).toBe("Due in 14 days\n\nThanks!");
    expect(draftNotesFooter({ terms: " ", notes: "Thanks!" })).toBe("Thanks!");
    expect(draftNotesFooter({ terms: "", notes: "" })).toBe("");
  });
});
