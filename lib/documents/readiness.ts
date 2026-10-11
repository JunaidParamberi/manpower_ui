/**
 * What a document needs before it can leave the building (send, approval
 * link, mark as sent, convert). Drafts may be incomplete while they
 * autosave; these rules gate the outward actions, in the UI and on the
 * server.
 */

type Num = number | string | null | undefined;

export type ReadinessField = "client_id" | "line_items" | "valid_until" | "due_date";

export type ReadinessIssue = { field: ReadinessField; label: string };

export type DocumentReadiness = { type?: string; ready: boolean; missing: ReadinessIssue[] };

export type ReadinessDocument = {
  type: string;
  client_id: string | null | undefined;
  valid_until?: string | null;
  due_date?: string | null;
};

export type ReadinessLineItem = { quantity: Num; unit_price: Num };

const LABELS: Record<ReadinessField, string> = {
  client_id: "a client",
  line_items: "a line item with a price",
  valid_until: "a valid-until date",
  due_date: "a due date",
};

const TYPE_NOUN: Record<string, string> = {
  quote: "quote",
  invoice: "invoice",
  local_purchase_order: "purchase order",
  proposal: "proposal",
};

const REQUIRED: Record<string, ReadinessField[]> = {
  quote: ["client_id", "line_items", "valid_until"],
  invoice: ["client_id", "line_items", "due_date"],
  local_purchase_order: ["client_id", "line_items"],
  proposal: ["client_id"],
};

function hasPricedLine(lineItems: ReadinessLineItem[]): boolean {
  return lineItems.some((li) => Number(li.quantity) > 0 && Number(li.unit_price) > 0);
}

function isPresent(doc: ReadinessDocument, lineItems: ReadinessLineItem[], field: ReadinessField): boolean {
  switch (field) {
    case "client_id":
      return Boolean(doc.client_id);
    case "line_items":
      return hasPricedLine(lineItems);
    case "valid_until":
      return Boolean(doc.valid_until);
    case "due_date":
      return Boolean(doc.due_date);
  }
}

export function getDocumentReadiness(
  doc: ReadinessDocument,
  lineItems: ReadinessLineItem[],
): DocumentReadiness {
  const missing = (REQUIRED[doc.type] ?? [])
    .filter((field) => !isPresent(doc, lineItems, field))
    .map((field) => ({ field, label: LABELS[field] }));
  return { type: doc.type, ready: missing.length === 0, missing };
}

function joinLabels(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/**
 * "Add a client and a due date before you send this invoice." — or null when
 * nothing is missing. `action` is the verb shown to the user.
 */
export function readinessMessage(
  readiness: DocumentReadiness,
  action: "send" | "mark it as sent" | "convert it",
): string | null {
  if (readiness.ready) return null;
  const labels = joinLabels(readiness.missing.map((m) => m.label));
  const noun = readiness.type ? TYPE_NOUN[readiness.type] : undefined;
  if (action === "send") {
    return `Add ${labels} before you send this ${noun ?? "document"}.`;
  }
  return `Add ${labels} before you ${action}.`;
}
