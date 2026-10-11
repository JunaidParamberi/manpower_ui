import { isTaxMode } from "@/lib/documents/tax/document-tax-core";
import type { DocumentType } from "@/types";

export const DEFAULT_TERMS_DAYS = 30;
export const QUOTE_VALID_DAYS = 30;
// Creation itself finishes (including the automatic title refresh) within this window.
export const UNTOUCHED_WINDOW_MS = 3_000;
export const UNTOUCHED_MAX_AGE_MS = 86_400_000;

/** The user's own calendar day as `YYYY-MM-DD`, from the browser clock (not the UTC day). */
export function localTodayIso(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

/** Calendar-day arithmetic on `YYYY-MM-DD` in UTC, so no timezone drift. */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function termsLabel(days: number): string {
  return days === 0 ? "On receipt" : `Net ${days}`;
}

export function dueDateFromTerms(issuedIso: string, termsDays: number | null | undefined): string {
  return addDaysIso(issuedIso, termsDays ?? DEFAULT_TERMS_DAYS);
}

export type DraftDefaultsInput = {
  type: DocumentType;
  /** `YYYY-MM-DD` in the user's day. */
  today: string;
  clientId: string | null;
  projectId: string | null;
  client: { currency: string | null; payment_terms_days: number | null } | null;
  project: { client_id: string | null } | null;
  profile: { default_currency: string | null; default_tax_mode: string | null; default_tax_rate: number | null } | null;
};

export type DraftDefaults = {
  client_id: string | null;
  project_id: string | null;
  currency: string;
  due_date: string | null;
  payment_terms: string | null;
  valid_until: string | null;
  tax_mode: string;
  tax_rate: number;
};

export function draftDefaults(input: DraftDefaultsInput): DraftDefaults {
  const clientId = input.clientId ?? input.project?.client_id ?? null;
  const currency =
    input.client?.currency?.trim() || input.profile?.default_currency?.trim() || "USD";
  const profileMode = input.profile?.default_tax_mode ?? "none";
  const taxMode = isTaxMode(profileMode) ? profileMode : "none";
  const taxRate = taxMode === "none" ? 0 : Number(input.profile?.default_tax_rate ?? 0);

  let dueDate: string | null = null;
  let paymentTerms: string | null = null;
  let validUntil: string | null = null;
  if (input.type === "invoice") {
    const days = input.client?.payment_terms_days ?? DEFAULT_TERMS_DAYS;
    dueDate = addDaysIso(input.today, days);
    paymentTerms = termsLabel(days);
  } else if (input.type === "quote") {
    validUntil = addDaysIso(input.today, QUOTE_VALID_DAYS);
  }

  return {
    client_id: clientId,
    project_id: input.projectId,
    currency,
    due_date: dueDate,
    payment_terms: paymentTerms,
    valid_until: validUntil,
    tax_mode: taxMode,
    tax_rate: taxRate,
  };
}

export type UntouchedCheck = {
  status: string;
  lineItemCount: number;
  createdAt: string;
  updatedAt: string | null;
  now: string;
};

/** A draft nobody has written to since it was created. See the spec. */
export function isUntouchedDraft(doc: UntouchedCheck): boolean {
  if (doc.status !== "draft" || doc.lineItemCount > 0) return false;
  const created = Date.parse(doc.createdAt);
  if (Date.parse(doc.now) - created > UNTOUCHED_MAX_AGE_MS) return false;
  if (!doc.updatedAt) return true;
  return Date.parse(doc.updatedAt) - created <= UNTOUCHED_WINDOW_MS;
}
