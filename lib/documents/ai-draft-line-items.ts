import type { DocumentDraftResult } from "@/lib/ai/document-writer-result";

export type AiLineItemInsert = {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  sort_order: number;
};

export function applyAiDraftToLineItemRows(draft: DocumentDraftResult): AiLineItemInsert[] {
  if (draft.docType === "proposal") {
    return [];
  }
  return draft.lineItems.map((item, index) => ({
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    tax_rate: item.taxRate ?? 0,
    sort_order: index,
  }));
}

/**
 * The draft's terms and notes as the document's notes/footer. They used to
 * be dropped on create, so an AI invoice lost its payment terms.
 */
export function draftNotesFooter(draft: Pick<DocumentDraftResult, "terms" | "notes">): string {
  return [draft.terms.trim(), draft.notes.trim()].filter(Boolean).join("\n\n");
}
