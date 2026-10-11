/**
 * The assistant's `edit_document` tool, described in plain language: how a
 * document is named ("invoice INV-0008"), what a set of line items adds up
 * to, and the confirmation lines a person sees before a draft changes.
 * Pure — the executor and the confirm step fetch rows and pass them in.
 * Shared verbatim with the Deno `assistant` functions: relative imports only.
 */

export type EditLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
};

export type DocumentIdentity = {
  type: string;
  title?: string | null;
  invoice_number?: string | null;
  quote_number?: string | null;
  proposal_number?: string | null;
  lpo_number?: string | null;
  receipt_number?: string | null;
};

const TYPE_NOUN: Record<string, string> = {
  invoice: "invoice",
  quote: "quote",
  proposal: "proposal",
  receipt: "receipt",
  local_purchase_order: "purchase order",
  credit_note: "credit note",
  delivery_note: "delivery note",
  statement: "statement",
};

/** "invoice INV-0008", or "quote “Website Redesign”" when it has no number yet. */
export function documentLabel(doc: DocumentIdentity): string {
  const noun = TYPE_NOUN[doc.type] ?? "document";
  const number =
    doc.invoice_number ?? doc.quote_number ?? doc.proposal_number ?? doc.lpo_number ?? doc.receipt_number ?? null;
  if (number) {
    return `${noun} ${number}`;
  }
  return doc.title?.trim() ? `${noun} “${doc.title.trim()}”` : noun;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Gross total of a set of line items: quantity × price, plus each line's tax. */
export function lineItemsTotal(items: EditLineItem[]): number {
  return round2(
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice * (1 + (item.taxRate ?? 0) / 100), 0),
  );
}

export function formatMoney(amount: number, currency: string | null | undefined): string {
  const fixed = Number.isInteger(amount) ? amount.toLocaleString("en-US") : amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${currency} ${fixed}` : fixed;
}

/** "Website Redesign × 1 @ AED 10,000 (+5% tax)" */
export function describeLineItem(item: EditLineItem, currency: string | null | undefined): string {
  const tax = item.taxRate ? ` (+${item.taxRate}% tax)` : "";
  return `${item.description} × ${item.quantity} @ ${formatMoney(item.unitPrice, currency)}${tax}`;
}

const MAX_LISTED_ITEMS = 5;

export type EditFields = {
  client_id?: string | null;
  project_id?: string | null;
  title?: string;
  due_date?: string | null;
  currency?: string;
  notes_footer?: string | null;
};

export type EditInput = {
  documentId: string;
  fields?: EditFields;
  lineItems?: EditLineItem[];
  copyLineItemsFrom?: string;
};

/**
 * What the confirmation step resolved about the document and the records the
 * edit points at. `refs` maps an id to a human label (client name, project
 * title, "quote QUO-0004"); `before` holds current values, already readable.
 */
export type EditContext = {
  label: string | null;
  currency: string | null;
  refs: Record<string, string>;
  before: {
    client?: string | null;
    project?: string | null;
    due_date?: string | null;
    title?: string | null;
    currency?: string | null;
    lineItemCount?: number;
    total?: number;
  };
};

export const EMPTY_EDIT_CONTEXT: EditContext = { label: null, currency: null, refs: {}, before: {} };

function show(value: string | null | undefined): string {
  return value === null || value === undefined || value === "" ? "none" : value;
}

function change(label: string, before: string | null | undefined, after: string): string {
  const previous = show(before);
  return previous === after || before === undefined ? `${label}: ${after}` : `${label}: ${previous} → ${after}`;
}

/** The lines on the confirmation card — every change, never an id. */
export function editConfirmLines(input: EditInput, context: EditContext = EMPTY_EDIT_CONTEXT): string[] {
  const lines: string[] = [];
  const fields = input.fields ?? {};
  const currency = fields.currency ?? context.currency;

  if ("client_id" in fields) {
    const after = fields.client_id ? (context.refs[fields.client_id] ?? "the chosen client") : "none";
    lines.push(change("Client", context.before.client, after));
  }
  if ("project_id" in fields) {
    const after = fields.project_id ? (context.refs[fields.project_id] ?? "the chosen project") : "none";
    lines.push(change("Project", context.before.project, after));
  }
  if (fields.title !== undefined) {
    lines.push(change("Title", context.before.title, fields.title));
  }
  if ("due_date" in fields) {
    lines.push(change("Due date", context.before.due_date, show(fields.due_date)));
  }
  if (fields.currency !== undefined) {
    lines.push(change("Currency", context.before.currency, fields.currency));
  }
  if ("notes_footer" in fields) {
    lines.push(fields.notes_footer ? "Notes/footer: updated" : "Notes/footer: cleared");
  }

  if (input.copyLineItemsFrom) {
    const source = context.refs[input.copyLineItemsFrom] ?? "the source document";
    lines.push(`Line items: copy every item, price and tax from ${source}`);
  }
  if (input.lineItems) {
    const count = context.before.lineItemCount;
    lines.push(
      count === undefined
        ? `Line items: set to ${input.lineItems.length}`
        : `Line items: replace ${count} with ${input.lineItems.length}`,
    );
    for (const item of input.lineItems.slice(0, MAX_LISTED_ITEMS)) {
      lines.push(`  • ${describeLineItem(item, currency)}`);
    }
    if (input.lineItems.length > MAX_LISTED_ITEMS) {
      lines.push(`  • …and ${input.lineItems.length - MAX_LISTED_ITEMS} more`);
    }
    const total = lineItemsTotal(input.lineItems);
    const before = context.before.total;
    lines.push(
      before === undefined
        ? `Total: ${formatMoney(total, currency)}`
        : `Total: ${formatMoney(before, currency)} → ${formatMoney(total, currency)}`,
    );
  }
  return lines;
}

/** One line for the action card and the trail once the edit ran. */
export function summarizeDocumentEdit(
  label: string,
  result: { fieldCount: number; lineItems: EditLineItem[] | null; currency: string | null },
): string {
  const parts: string[] = [];
  if (result.lineItems) {
    parts.push(
      `${result.lineItems.length} line item${result.lineItems.length === 1 ? "" : "s"}, total ${formatMoney(lineItemsTotal(result.lineItems), result.currency)}`,
    );
  }
  if (result.fieldCount > 0) {
    parts.push(`${result.fieldCount} detail${result.fieldCount === 1 ? "" : "s"}`);
  }
  return `Updated ${label}${parts.length ? ` (${parts.join("; ")})` : ""}`;
}

/** Only drafts change; anything else gets a reason the model can relay. */
export function editBlockedReason(label: string, status: string): string | null {
  if (status === "draft") {
    return null;
  }
  const readable = status.replace(/_/g, " ");
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} is ${readable}, and only drafts can be edited. Offer to create a new draft (or a credit note for an issued invoice) instead.`;
}
