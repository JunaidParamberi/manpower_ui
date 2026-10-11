import { format, formatDistanceToNow, parseISO } from "date-fns";

import type { DocumentType } from "@/types";
import type { ActivityEvent, ActivityEventType } from "./types";

export type DocumentActivitySource = {
  id: string;
  type: DocumentType;
  sent_at: string | null;
  paid_at: string | null;
  approved_at: string | null;
  declined_at: string | null;
  invoice_number: string | null;
  quote_number: string | null;
  title: string;
  clientName: string | null;
  amount: number | null;
  /** Document's own currency — the profile default would mislabel the money. */
  currency?: string | null;
};

export type ProjectActivitySource = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  clientName: string | null;
};

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

function docNumber(doc: DocumentActivitySource): string {
  if (doc.type === "invoice" && doc.invoice_number) return doc.invoice_number;
  if (doc.type === "quote" && doc.quote_number) return doc.quote_number;
  return doc.title;
}

function eventId(docId: string, type: ActivityEventType): string {
  return `${docId}:${type}`;
}

export function extractDocumentEvents(doc: DocumentActivitySource): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const client = doc.clientName ?? "client";
  const number = docNumber(doc);

  if (doc.paid_at) {
    events.push({
      type: "invoice_paid",
      id: eventId(doc.id, "invoice_paid"),
      href: `/documents/${doc.id}`,
      who: client,
      text: `paid invoice #${number}`,
      amount: doc.amount ?? null,
      currency: doc.currency ?? null,
      label: `${client} paid invoice #${number}`,
      timestamp: parseISO(doc.paid_at),
    });
  }

  if (doc.sent_at) {
    const typeLabel = DOC_TYPE_LABELS[doc.type];
    events.push({
      type: "doc_sent",
      id: eventId(doc.id, "doc_sent"),
      href: `/documents/${doc.id}`,
      who: "You",
      text: `sent ${typeLabel} #${number}`,
      metaSuffix: client,
      label: `You sent ${typeLabel} #${number} · ${client}`,
      timestamp: parseISO(doc.sent_at),
    });
  }

  if (doc.approved_at) {
    events.push({
      type: "quote_approved",
      id: eventId(doc.id, "quote_approved"),
      href: `/documents/${doc.id}`,
      who: client,
      text: `approved Quote #${number}`,
      amount: doc.amount ?? null,
      currency: doc.currency ?? null,
      label: `${client} approved Quote #${number}`,
      timestamp: parseISO(doc.approved_at),
    });
  }

  if (doc.declined_at) {
    events.push({
      type: "quote_declined",
      id: eventId(doc.id, "quote_declined"),
      href: `/documents/${doc.id}`,
      who: client,
      text: `declined Quote #${number}`,
      label: `${client} declined Quote #${number}`,
      timestamp: parseISO(doc.declined_at),
    });
  }

  return events;
}

export function extractProjectEvents(project: ProjectActivitySource): ActivityEvent[] {
  const statusLabel = project.status.replace(/_/g, " ");
  return [
    {
      type: "project_status_changed",
      id: `${project.id}:status`,
      href: `/projects/${project.id}`,
      who: project.title,
      text: `marked ${statusLabel}`,
      metaSuffix: project.clientName ?? null,
      label: `${project.title} marked ${statusLabel}`,
      timestamp: parseISO(project.updated_at),
    },
  ];
}

export function mergeAndSortEvents(
  events: ActivityEvent[],
  limit: number
): ActivityEvent[] {
  return [...events]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

export function formatActivityTimestamp(date: Date | string, now = new Date()): string {
  const d = date instanceof Date ? date : new Date(date);
  const days = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days > 7) {
    return format(d, "MMM d");
  }
  return formatDistanceToNow(d, { addSuffix: true });
}
