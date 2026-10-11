/**
 * Building an AI draft from an existing document ("turn quote QUO-0004 into
 * an invoice"). The source's line items, prices, tax, currency, client and
 * project are copied exactly — the model only writes the title and terms —
 * so an AI-drafted invoice can never come out with zero prices or no client
 * when the quote it came from had them.
 *
 * Shared verbatim with the Deno `document-writer` Edge Function: relative
 * imports only.
 */

import type { DocumentDraftLineItem, DocumentDraftResult } from "../ai/document-writer-result.ts";

export type SourceLineItem = {
  description: string | null;
  quantity: number | string | null;
  unit_price: number | string | null;
  tax_rate: number | string | null;
  sort_order: number | null;
};

export type SourceDocument = {
  id: string;
  type: string;
  status: string;
  title: string | null;
  client_id: string | null;
  project_id: string | null;
  currency: string | null;
  quote_number?: string | null;
  proposal_number?: string | null;
  line_items: SourceLineItem[] | null;
};

function toNumber(value: number | string | null | undefined): number {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

/** Source line items in display order, normalised to the draft schema's bounds. */
export function sourceLineItems(source: SourceDocument): DocumentDraftLineItem[] {
  return [...(source.line_items ?? [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((item) => {
      const quantity = toNumber(item.quantity);
      const taxRate = Math.min(100, Math.max(0, toNumber(item.tax_rate)));
      return {
        description: (item.description ?? "").trim().slice(0, 300) || "Item",
        quantity: quantity > 0 ? quantity : 1,
        unitPrice: Math.max(0, toNumber(item.unit_price)),
        ...(taxRate > 0 ? { taxRate } : {}),
      };
    });
}

/** Lines for the writer's user prompt, so its title and terms fit the source. */
export function describeSourceForPrompt(source: SourceDocument): string {
  const number = source.quote_number ?? source.proposal_number ?? null;
  const items = sourceLineItems(source)
    .map((item) => `  - ${item.description}: ${item.quantity} × ${item.unitPrice}${item.taxRate ? ` (+${item.taxRate}% tax)` : ""}`)
    .join("\n");
  return [
    `Source document: ${source.type}${number ? ` ${number}` : ""} "${source.title ?? ""}" (status: ${source.status}, currency: ${source.currency ?? "unknown"}).`,
    "Its line items are copied into the draft exactly — reuse them, do not change prices:",
    items || "  (no line items)",
  ].join("\n");
}

/**
 * Server-authoritative merge: whatever the model wrote, the draft carries
 * the source's line items, currency and project, and points back at it.
 * A source with no line items keeps the model's items.
 */
export function applySourceToDraft(draft: DocumentDraftResult, source: SourceDocument): DocumentDraftResult {
  const items = sourceLineItems(source);
  const currency = source.currency?.trim().toUpperCase();
  return {
    ...draft,
    lineItems: items.length > 0 ? items : draft.lineItems,
    currency: currency && /^[A-Z]{3}$/.test(currency) ? currency : draft.currency,
    projectId: draft.projectId ?? source.project_id ?? undefined,
    sourceDocumentId: source.id,
  };
}

/** An approved quote turned into an invoice goes through the app's own quote → invoice conversion. */
export function shouldConvertQuote(
  draft: Pick<DocumentDraftResult, "docType" | "sourceDocumentId">,
  source: Pick<SourceDocument, "type" | "status"> | null,
): boolean {
  return (
    draft.docType === "invoice" &&
    Boolean(draft.sourceDocumentId) &&
    source?.type === "quote" &&
    source.status === "approved"
  );
}
