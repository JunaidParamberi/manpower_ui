import { daysBetweenIso } from "@/lib/clients/health-facts";
import { columnForSlot, type WorkerDocumentSlot } from "@/lib/workers/worker-document-slots";
import type { WorkerListRow } from "@/types";

export const EXPIRING_SOON_DAYS = 30;

export const REQUIRED_DOCUMENT_SLOTS: readonly WorkerDocumentSlot[] = [
  "passport_document",
  "emirates_id_document",
  "visa_document",
  "photo",
  "workmen_compensation_document",
  "medical_insurance_card",
  "noc_current_sponsor_document",
  "noc_client_document",
  "trade_license_document",
];

export type WorkerExpiry = {
  kind: "passport" | "emirates_id" | "visa" | "medical" | "insurance";
  label: string;
  date: string;
  daysLeft: number;
};

const EXPIRY_SOURCES: ReadonlyArray<{
  kind: WorkerExpiry["kind"];
  label: string;
  column: "passport_expiry" | "emirates_id_expiry" | "visa_expiry" | "medical_expiry" | "insurance_expiry";
}> = [
  { kind: "passport", label: "Passport", column: "passport_expiry" },
  { kind: "emirates_id", label: "Emirates ID", column: "emirates_id_expiry" },
  { kind: "visa", label: "Visa", column: "visa_expiry" },
  { kind: "medical", label: "Medical", column: "medical_expiry" },
  { kind: "insurance", label: "Insurance", column: "insurance_expiry" },
];

export function workerExpiries(w: WorkerListRow, nowIso: string): WorkerExpiry[] {
  const out: WorkerExpiry[] = [];
  for (const { kind, label, column } of EXPIRY_SOURCES) {
    const date = w[column];
    if (!date) continue;
    out.push({ kind, label, date, daysLeft: daysBetweenIso(nowIso, date) });
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function nextExpiry(w: WorkerListRow, nowIso: string): WorkerExpiry | null {
  return workerExpiries(w, nowIso)[0] ?? null;
}

function hasValue(w: WorkerListRow, column: string): boolean {
  const v = (w as unknown as Record<string, unknown>)[column];
  return typeof v === "string" && v.length > 0;
}

export function uploadedRequiredCount(w: WorkerListRow): number {
  return REQUIRED_DOCUMENT_SLOTS.filter((slot) => hasValue(w, columnForSlot(slot))).length;
}

/** A worker counts as insured when the flag is set or an insurance card was uploaded on the Documents tab. */
export function workerInsured(w: WorkerListRow): boolean {
  return Boolean(w.has_insurance) || hasValue(w, "medical_insurance_card_url");
}

export type WorkerIssue = {
  id: string;
  title: string;
  detail: string;
  tone: "danger" | "warning";
};

function days(n: number): string {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

export function workerIssues(w: WorkerListRow, nowIso: string): WorkerIssue[] {
  const issues: WorkerIssue[] = [];
  const expiries = workerExpiries(w, nowIso);

  for (const e of expiries) {
    if (e.daysLeft >= 0) continue;
    issues.push({
      id: `expired-${e.kind}`,
      title: `${e.label} expired`,
      detail: `Expired ${days(-e.daysLeft)} ago. Renew it before the next site visit.`,
      tone: "danger",
    });
  }

  for (const e of expiries) {
    if (e.daysLeft < 0 || e.daysLeft > EXPIRING_SOON_DAYS) continue;
    issues.push({
      id: `expiring-${e.kind}`,
      title: e.daysLeft === 0 ? `${e.label} expires today` : `${e.label} expires in ${days(e.daysLeft)}`,
      detail: "Start the renewal now so the worker stays deployable.",
      tone: "warning",
    });
  }

  const missing: string[] = [];
  if (!hasValue(w, "passport_document_url")) missing.push("passport");
  if (!hasValue(w, "emirates_id_document_url")) missing.push("Emirates ID");
  if (!hasValue(w, "visa_document_url")) missing.push("visa");
  if (missing.length > 0) {
    issues.push({
      id: "missing-ids",
      title: `Missing ${missing.join(", ")}`,
      detail: "Needed for site access and the labour card.",
      tone: "warning",
    });
  }

  if (!workerInsured(w)) {
    issues.push({
      id: "no-insurance",
      title: "No medical insurance",
      detail: "Add an insurance card on the Documents tab.",
      tone: "warning",
    });
  }

  return issues;
}

export type WorkerGroup = "needs-you" | "ready" | "inactive";

export function workerGroupOf(w: WorkerListRow, nowIso: string): WorkerGroup {
  if (w.status === "inactive") return "inactive";
  return workerIssues(w, nowIso).length > 0 ? "needs-you" : "ready";
}

export type WorkerLens = "all" | "needs-you" | "ready" | "deployed";

export const WORKER_LENSES: ReadonlyArray<{ id: WorkerLens; label: string }> = [
  { id: "all", label: "All" },
  { id: "needs-you", label: "Needs you" },
  { id: "ready", label: "Ready" },
  { id: "deployed", label: "Deployed" },
];

export const WORKER_GROUPS: ReadonlyArray<{ id: WorkerGroup; label: string }> = [
  { id: "needs-you", label: "Needs you" },
  { id: "ready", label: "Ready" },
  { id: "inactive", label: "Inactive" },
];

export function parseWorkerLens(v: string | null | undefined): WorkerLens {
  return WORKER_LENSES.some((l) => l.id === v) ? (v as WorkerLens) : "all";
}

export function matchesWorkerLens(w: WorkerListRow, lens: WorkerLens, nowIso: string): boolean {
  switch (lens) {
    case "all":
      return true;
    case "deployed":
      return w.status === "deployed";
    case "needs-you":
    case "ready":
      return workerGroupOf(w, nowIso) === lens;
  }
}

export function countWorkerLenses(ws: WorkerListRow[], nowIso: string): Record<WorkerLens, number> {
  const counts: Record<WorkerLens, number> = { all: 0, "needs-you": 0, ready: 0, deployed: 0 };
  for (const w of ws) {
    for (const { id } of WORKER_LENSES) {
      if (matchesWorkerLens(w, id, nowIso)) counts[id] += 1;
    }
  }
  return counts;
}

export function workerMonogram(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}
