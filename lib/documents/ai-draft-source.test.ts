import { describe, expect, it } from "vitest";

import type { DocumentDraftResult } from "@/lib/ai/document-writer-result";
import {
  applySourceToDraft,
  describeSourceForPrompt,
  shouldConvertQuote,
  sourceLineItems,
  type SourceDocument,
} from "./ai-draft-source";

const quote: SourceDocument = {
  id: "0b4f6c1e-1d2a-4c3b-9e8f-7a6b5c4d3e2f",
  type: "quote",
  status: "approved",
  title: "Website Redesign",
  client_id: "c3d1a2b4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  project_id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  currency: "aed",
  quote_number: "QUO-0004",
  line_items: [
    { description: "Build", quantity: "1", unit_price: "6500", tax_rate: "5", sort_order: 1 },
    { description: "Design", quantity: 2, unit_price: 2000, tax_rate: 0, sort_order: 0 },
  ],
};

const modelDraft: DocumentDraftResult = {
  title: "Invoice – Website Redesign (Ref: QUO-0004)",
  docType: "invoice",
  lineItems: [{ description: "Website Redesign Services (as per approved quote)", quantity: 1, unitPrice: 0 }],
  terms: "Due within 14 days",
  notes: "",
  currency: "USD",
  clientMatchStatus: "matched",
  matchedClientId: "c3d1a2b4-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
};

describe("sourceLineItems", () => {
  it("copies items in order with numeric prices and tax", () => {
    expect(sourceLineItems(quote)).toEqual([
      { description: "Design", quantity: 2, unitPrice: 2000 },
      { description: "Build", quantity: 1, unitPrice: 6500, taxRate: 5 },
    ]);
  });

  it("normalises bad rows instead of failing the draft", () => {
    expect(
      sourceLineItems({
        ...quote,
        line_items: [{ description: "  ", quantity: 0, unit_price: -5, tax_rate: 300, sort_order: null }],
      }),
    ).toEqual([{ description: "Item", quantity: 1, unitPrice: 0, taxRate: 100 }]);
  });
});

describe("applySourceToDraft", () => {
  it("replaces the model's zero-priced items with the quote's real ones", () => {
    const draft = applySourceToDraft(modelDraft, quote);
    expect(draft.lineItems).toHaveLength(2);
    expect(draft.lineItems.every((item) => item.unitPrice > 0)).toBe(true);
    expect(draft.currency).toBe("AED");
    expect(draft.projectId).toBe(quote.project_id);
    expect(draft.sourceDocumentId).toBe(quote.id);
    expect(draft.title).toBe(modelDraft.title);
  });

  it("keeps an explicit project and the model's items when the source has none", () => {
    const draft = applySourceToDraft(
      { ...modelDraft, projectId: "f0e1d2c3-b4a5-4968-8776-655443322110" },
      { ...quote, line_items: [], currency: null },
    );
    expect(draft.projectId).toBe("f0e1d2c3-b4a5-4968-8776-655443322110");
    expect(draft.lineItems).toEqual(modelDraft.lineItems);
    expect(draft.currency).toBe("USD");
  });
});

describe("describeSourceForPrompt", () => {
  it("lists the number, status and every priced line", () => {
    const text = describeSourceForPrompt(quote);
    expect(text).toContain("quote QUO-0004");
    expect(text).toContain("status: approved");
    expect(text).toContain("Build: 1 × 6500 (+5% tax)");
  });
});

describe("shouldConvertQuote", () => {
  it("converts only an approved quote into an invoice", () => {
    const withSource = { ...modelDraft, sourceDocumentId: quote.id };
    expect(shouldConvertQuote(withSource, quote)).toBe(true);
    expect(shouldConvertQuote(withSource, { ...quote, status: "sent" })).toBe(false);
    expect(shouldConvertQuote(withSource, { ...quote, type: "proposal" })).toBe(false);
    expect(shouldConvertQuote({ ...withSource, docType: "quote" }, quote)).toBe(false);
    expect(shouldConvertQuote(modelDraft, quote)).toBe(false);
    expect(shouldConvertQuote(withSource, null)).toBe(false);
  });
});
