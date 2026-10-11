import { differenceInDays, startOfDay } from "date-fns";

import type { DocumentStatus, DocumentType } from "@/types";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  proposal: "Proposal",
  quote: "Quote",
  invoice: "Invoice",
  receipt: "Receipt",
  local_purchase_order: "Local Purchase Order",
  other: "Document",
  statement: "Statement",
  credit_note: "Credit Note",
  delivery_note: "Delivery Note",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  paid: "Paid",
  partially_paid: "Partially Paid",
  written_off: "Written Off",
  archived: "Archived",
  approved: "Approved",
  declined: "Declined",
  voided: "Voided",
};

export type DocumentStatusVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive";

export const DOCUMENT_STATUS_VARIANTS: Record<
  DocumentStatus,
  DocumentStatusVariant
> = {
  draft: "outline",
  sent: "secondary",
  viewed: "secondary",
  signed: "default",
  paid: "default",
  partially_paid: "secondary",
  written_off: "outline",
  archived: "outline",
  approved: "default",
  declined: "destructive",
  voided: "outline",
};

export const INVOICE_MANUAL_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "archived",
] as const satisfies readonly DocumentStatus[];

export type ManualInvoiceStatus = (typeof INVOICE_MANUAL_STATUSES)[number];

export function documentTypeLabel(type: DocumentType): string {
  return DOCUMENT_TYPE_LABELS[type];
}

export function documentStatusLabel(status: DocumentStatus): string {
  return DOCUMENT_STATUS_LABELS[status];
}

export function documentStatusVariant(
  status: DocumentStatus,
): DocumentStatusVariant {
  return DOCUMENT_STATUS_VARIANTS[status];
}

export function isManualInvoiceStatus(
  status: string,
): status is ManualInvoiceStatus {
  return INVOICE_MANUAL_STATUSES.includes(status as ManualInvoiceStatus);
}

/** Tailwind background classes for list/table status dots. */
export const DOCUMENT_STATUS_DOT: Record<string, string> = {
  draft: "bg-zinc-400",
  sent: "bg-blue-400",
  viewed: "bg-indigo-400",
  approved: "bg-emerald-400",
  declined: "bg-red-400",
  paid: "bg-emerald-500",
  partially_paid: "bg-amber-400",
  overdue: "bg-red-500",
  written_off: "bg-zinc-400",
  voided: "bg-zinc-400",
  cancelled: "bg-zinc-400",
  archived: "bg-zinc-400",
};

const SETTLED_STATUSES = new Set([
  "paid",
  "partially_paid",
  "written_off",
  "voided",
  "cancelled",
  "archived",
]);

export function isDocumentOverdue(args: {
  status: string;
  dueDate: string | null | undefined;
  now?: Date;
}): boolean {
  if (SETTLED_STATUSES.has(args.status) || !args.dueDate) return false;
  const today = startOfDay(args.now ?? new Date());
  const due = startOfDay(new Date(args.dueDate));
  return due < today;
}

export function documentStatusDotClass(status: string, overdue = false): string {
  if (overdue) return DOCUMENT_STATUS_DOT.overdue;
  return DOCUMENT_STATUS_DOT[status] ?? "bg-zinc-400";
}

export function documentListStatusLabel(
  status: DocumentStatus,
  overdue = false,
): string {
  if (overdue) return "Overdue";
  return documentStatusLabel(status);
}

export type DueDateCountdown = {
  label: string;
  color: "muted" | "amber" | "destructive";
};

export function getDocumentDueDateCountdown(
  dueIso: string | null | undefined,
  status: string,
  now = new Date(),
): DueDateCountdown | null {
  if (!dueIso || SETTLED_STATUSES.has(status)) return null;
  const today = startOfDay(now);
  const due = startOfDay(new Date(dueIso));
  const diff = differenceInDays(due, today);
  if (diff > 0) return { label: `Due in ${diff}d`, color: "muted" };
  if (diff === 0) return { label: "Due today", color: "amber" };
  return { label: `${Math.abs(diff)}d overdue`, color: "destructive" };
}

export function formatDocumentAmount(
  amount: number | null,
  currency: string,
  locale = "en-US",
): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getDocumentListNumber(doc: {
  title: string;
  invoice_number?: string | null;
  quote_number?: string | null;
  proposal_number?: string | null;
  receipt_number?: string | null;
  lpo_number?: string | null;
}): string {
  return (
    doc.invoice_number ??
    doc.quote_number ??
    doc.proposal_number ??
    doc.receipt_number ??
    doc.lpo_number ??
    doc.title.slice(0, 20)
  );
}

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  invoice: "INV",
  quote: "QUO",
  proposal: "PRO",
  receipt: "RCT",
  local_purchase_order: "LPO",
  other: "DOC",
  statement: "SOA",
  credit_note: "CN",
  delivery_note: "DN",
};
