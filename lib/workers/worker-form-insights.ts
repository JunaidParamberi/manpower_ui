import { daysBetweenIso } from "@/lib/clients/health-facts";
import { workerMonogram } from "@/lib/workers/worker-readiness";
import {
  WORKER_STATUS_LABELS,
  type WorkerInput,
  type WorkerStatusValue,
} from "@/lib/validations/worker";
import type { SupplierRow } from "@/types";

type CompletionItem = {
  id: "employee_id" | "name" | "status" | "id_details" | "expiries";
  label: string;
  complete: boolean;
  /** DOM id of the first field to fix for this item — powers aside jump links. */
  jumpTarget: string;
};

export type WorkerFormSteps = {
  identity: boolean;
  work: boolean;
  documents: boolean;
};

export type ExpiryNote = {
  label: "expired" | "due soon" | "valid";
  tone: "danger" | "warning" | "muted";
};

export type WorkerFormInsights = {
  monogram: string;
  displayName: string;
  status: WorkerStatusValue;
  statusLabel: string;
  /** "EMP/2026/0002 · Mason · Ghana" — only the parts that exist. */
  metaLabel: string;
  supplierLabel: string;
  clientsCount: number;
  /** "Passport · expired 4d ago" / "Emirates ID · expires today" / "Visa · in 21d"; null when no dates entered. */
  nextExpiryLabel: string | null;
  completionItems: CompletionItem[];
  completedCount: number;
  totalCount: number;
  completionPercent: number;
  missingEssentials: string[];
  /** Grouped completion for the stepped form layout. */
  steps: WorkerFormSteps;
  completedSteps: number;
  totalSteps: number;
};

const EXPIRY_FIELDS: ReadonlyArray<{
  field: keyof WorkerInput;
  label: string;
}> = [
  { field: "passport_expiry", label: "Passport" },
  { field: "emirates_id_expiry", label: "Emirates ID" },
  { field: "visa_expiry", label: "Visa" },
  { field: "medical_expiry", label: "Medical" },
  { field: "insurance_expiry", label: "Insurance" },
];

const MISSING_COPY: Record<CompletionItem["id"], string> = {
  employee_id: "Add an employee ID",
  name: "Add a name",
  status: "Choose a status",
  id_details: "Add passport, Emirates ID and visa numbers",
  expiries: "Add passport, Emirates ID and visa expiry dates",
};

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function completionPercent(completedCount: number, totalCount: number): number {
  if (totalCount === 0) return 0;
  return Math.round((completedCount / totalCount) * 100);
}

function nextExpiryLabel(values: WorkerInput, nowIso: string): string | null {
  const dated = EXPIRY_FIELDS.map(({ field, label }) => ({
    label,
    date: text(values[field] as string | null),
  }))
    .filter((e) => e.date)
    .map((e) => ({ ...e, daysLeft: daysBetweenIso(nowIso, e.date) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const next = dated[0];
  if (!next) return null;
  if (next.daysLeft < 0)
    return `${next.label} · expired ${-next.daysLeft}d ago`;
  if (next.daysLeft === 0) return `${next.label} · expires today`;
  return `${next.label} · in ${next.daysLeft}d`;
}

/** Per-field hint for the documents table — "expired" / "due soon" (≤30d) / "valid". */
export function expiryNote(
  date: string | null | undefined,
  nowIso: string,
): ExpiryNote | null {
  const value = text(date);
  if (!value) return null;
  const daysLeft = daysBetweenIso(nowIso, value);
  if (!Number.isFinite(daysLeft)) return null;
  if (daysLeft < 0) return { label: "expired", tone: "danger" };
  if (daysLeft <= 30) return { label: "due soon", tone: "warning" };
  return { label: "valid", tone: "muted" };
}

/** DOM id of the first incomplete field among a group — the jump-link target. */
function firstMissing(
  fields: ReadonlyArray<{ complete: boolean; id: string }>,
): string {
  return fields.find((f) => !f.complete)?.id ?? fields[0].id;
}

export function buildWorkerFormInsights(
  values: WorkerInput,
  nowIso: string,
  suppliers: SupplierRow[] = [],
): WorkerFormInsights {
  const employeeId = text(values.employee_id);
  const name = text(values.name);
  const trade = text(values.trade_category);
  const nationality = text(values.nationality);
  const status = values.status;
  const clientsCount = values.client_ids?.length ?? 0;

  const numberFields = [
    {
      complete: Boolean(text(values.passport_number)),
      id: "worker-passport-number",
    },
    { complete: Boolean(text(values.emirates_id)), id: "worker-emirates-id" },
    { complete: Boolean(text(values.visa_number)), id: "worker-visa-number" },
  ];
  const expiryFields = [
    {
      complete: Boolean(text(values.passport_expiry as string | null)),
      id: "worker-passport-expiry",
    },
    {
      complete: Boolean(text(values.emirates_id_expiry as string | null)),
      id: "worker-emirates-id-expiry",
    },
    {
      complete: Boolean(text(values.visa_expiry as string | null)),
      id: "worker-visa-expiry",
    },
  ];
  const idDetailsComplete = numberFields.every((f) => f.complete);
  const expiriesComplete = expiryFields.every((f) => f.complete);

  const completionItems: CompletionItem[] = [
    {
      id: "employee_id",
      label: "Employee ID",
      complete: Boolean(employeeId),
      jumpTarget: "worker-employee-id",
    },
    {
      id: "name",
      label: "Name",
      complete: Boolean(name),
      jumpTarget: "worker-name",
    },
    {
      id: "status",
      label: "Status",
      complete: Boolean(status),
      jumpTarget: "worker-status",
    },
    {
      id: "id_details",
      label: "Passport, Emirates ID & visa numbers",
      complete: idDetailsComplete,
      jumpTarget: firstMissing(numberFields),
    },
    {
      id: "expiries",
      label: "Passport, Emirates ID & visa expiries",
      complete: expiriesComplete,
      jumpTarget: firstMissing(expiryFields),
    },
  ];
  const completedCount = completionItems.filter((item) => item.complete).length;

  // Step 2 ticks once a placement exists (supplier or client site) — a nudge,
  // not validation: internal workers may genuinely have neither.
  const steps: WorkerFormSteps = {
    identity: Boolean(employeeId && name),
    work: Boolean(status) && Boolean(text(values.supplier_id) || clientsCount),
    documents: idDetailsComplete && expiriesComplete,
  };
  const completedSteps = [steps.identity, steps.work, steps.documents].filter(
    Boolean,
  ).length;

  return {
    monogram: workerMonogram(name),
    displayName: name || "Unnamed worker",
    status,
    statusLabel: WORKER_STATUS_LABELS[status],
    metaLabel: [employeeId, trade, nationality].filter(Boolean).join(" · "),
    supplierLabel:
      suppliers.find((s) => s.id === values.supplier_id)?.name ?? "",
    clientsCount,
    nextExpiryLabel: nextExpiryLabel(values, nowIso),
    completionItems,
    completedCount,
    totalCount: completionItems.length,
    completionPercent: completionPercent(
      completedCount,
      completionItems.length,
    ),
    missingEssentials: completionItems
      .filter((item) => !item.complete)
      .map((item) => MISSING_COPY[item.id]),
    steps,
    completedSteps,
    totalSteps: 3,
  };
}
