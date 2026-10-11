import { formatCurrency } from "@/lib/utils/format";
import type { DocumentType, NotificationPayload, NotificationType } from "@/types";

export type TaskNotificationSource = {
  id: string;
  title: string;
  projectId: string | null;
  projectTitle: string | null;
};

/**
 * The task's own name is what the user scans for, so it is the title; the due
 * state and project are the supporting line.
 */
export function buildTaskNotificationPayload(
  type: Extract<NotificationType, "task_due" | "task_overdue">,
  task: TaskNotificationSource,
): NotificationPayload {
  const href = task.projectId
    ? `/projects/${task.projectId}?tab=tasks`
    : `/tasks`;
  const suffix = task.projectTitle ? ` · ${task.projectTitle}` : "";
  const state = type === "task_due" ? "Due today" : "Overdue";

  return {
    href,
    entity_id: task.id,
    title: task.title,
    body: `${state}${suffix}`,
  };
}

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: "Invoice",
  quote: "Quote",
  proposal: "Proposal",
  receipt: "Receipt",
  local_purchase_order: "LPO",
  other: "Document",
  statement: "Statement",
  credit_note: "Credit Note",
  delivery_note: "Delivery Note",
};

export type DocumentNotificationSource = {
  id: string;
  type: DocumentType;
  title: string;
  invoice_number: string | null;
  quote_number: string | null;
  proposal_number: string | null;
  clientName: string | null;
  amount?: number | null;
};

function docNumber(doc: DocumentNotificationSource): string {
  if (doc.type === "invoice" && doc.invoice_number) return doc.invoice_number;
  if (doc.type === "quote" && doc.quote_number) return doc.quote_number;
  if (doc.type === "proposal" && doc.proposal_number) return doc.proposal_number;
  return doc.title;
}

/**
 * The event is the title ("Invoice #INV-0001 paid"); who and how much are the
 * supporting line. `body` is omitted rather than padded when there is no client
 * on the document.
 */
export function buildDocumentNotificationPayload(
  type: NotificationType,
  doc: DocumentNotificationSource
): NotificationPayload {
  const client = doc.clientName;
  const number = docNumber(doc);
  const href = `/documents/${doc.id}`;
  const base = { href, entity_id: doc.id };

  switch (type) {
    case "invoice_paid": {
      const amount = doc.amount != null ? formatCurrency(doc.amount) : null;
      const detail = [client, amount].filter(Boolean).join(" · ");
      return {
        ...base,
        title: `Invoice #${number} paid`,
        ...(detail ? { body: detail } : {}),
      };
    }
    case "doc_sent": {
      const typeLabel = DOC_TYPE_LABELS[doc.type];
      return {
        ...base,
        title: `${typeLabel} #${number} sent`,
        ...(client ? { body: `To ${client}` } : {}),
      };
    }
    case "quote_approved":
      return {
        ...base,
        title: `Quote #${number} approved`,
        ...(client ? { body: client } : {}),
      };
    case "quote_declined":
      return {
        ...base,
        title: `Quote #${number} declined`,
        ...(client ? { body: client } : {}),
      };
    case "proposal_approved":
      return {
        ...base,
        title: `Proposal #${number} approved`,
        ...(client ? { body: client } : {}),
      };
    default:
      return {
        ...base,
        title: `${DOC_TYPE_LABELS[doc.type]} #${number}`,
        ...(client ? { body: client } : {}),
      };
  }
}
