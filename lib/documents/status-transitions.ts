import type { DocumentStatus, DocumentType } from "@/types";

/**
 * Statuses that may only be set by workflow actions (payments, approvals,
 * voiding) — never by a generic edit form or manual status dropdown.
 */
export const WORKFLOW_ONLY_STATUSES = [
  "paid",
  "partially_paid",
  "written_off",
  "approved",
  "declined",
  "voided",
  "signed",
] as const satisfies readonly DocumentStatus[];

export const SETTLED_STATUSES = [
  "paid",
  "partially_paid",
  "written_off",
] as const satisfies readonly DocumentStatus[];

export function isSettledStatus(status: string): boolean {
  return (SETTLED_STATUSES as readonly string[]).includes(status);
}

type TransitionMap = Partial<Record<DocumentStatus, readonly DocumentStatus[]>>;

const SHARED_SEND_FLOW: TransitionMap = {
  draft: ["sent", "archived", "voided"],
  sent: ["viewed", "archived", "voided"],
  viewed: ["sent", "archived", "voided"],
  archived: ["draft"],
};

const APPROVAL_FLOW: TransitionMap = {
  ...SHARED_SEND_FLOW,
  sent: ["viewed", "approved", "declined", "archived", "voided"],
  viewed: ["sent", "approved", "declined", "archived", "voided"],
  approved: ["archived", "voided"],
  declined: ["archived", "voided"],
};

const INVOICE_FLOW: TransitionMap = {
  ...SHARED_SEND_FLOW,
  sent: ["viewed", "partially_paid", "paid", "written_off", "archived", "voided"],
  viewed: ["sent", "partially_paid", "paid", "written_off", "archived", "voided"],
  partially_paid: ["paid", "written_off"],
  // paid / written_off are terminal: corrections require a new document.
};

const TRANSITIONS: Record<DocumentType, TransitionMap> = {
  invoice: INVOICE_FLOW,
  quote: APPROVAL_FLOW,
  proposal: APPROVAL_FLOW,
  local_purchase_order: APPROVAL_FLOW,
  receipt: {}, // system-generated, immutable
  statement: SHARED_SEND_FLOW,
  credit_note: SHARED_SEND_FLOW,
  delivery_note: SHARED_SEND_FLOW,
  other: SHARED_SEND_FLOW,
};

export function canTransition(
  type: DocumentType,
  from: DocumentStatus,
  to: DocumentStatus,
): boolean {
  if (from === to) return from !== "voided";
  const allowed = TRANSITIONS[type]?.[from];
  return allowed ? allowed.includes(to) : false;
}

export type TransitionResult = { ok: true } | { ok: false; error: string };

export function assertTransition(
  type: DocumentType,
  from: DocumentStatus,
  to: DocumentStatus,
): TransitionResult {
  if (canTransition(type, from, to)) return { ok: true };
  return {
    ok: false,
    error: `Cannot move ${type.replace(/_/g, " ")} from "${from.replace(/_/g, " ")}" to "${to.replace(/_/g, " ")}".`,
  };
}
