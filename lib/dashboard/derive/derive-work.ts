// lib/dashboard/derive/derive-work.ts
import {
  classifyProjectRisk,
  formatPipelineDaysLabel,
  parseDeadlineDate,
} from "@/lib/dashboard/attention-utils";
import { resolveActualSpend } from "@/lib/projects/project-rollups";
import type { WorkDocumentRow, WorkFacts, WorkProjectRow } from "@/lib/dashboard/snapshot-types";

export type WorkProjectInput = {
  id: string; title: string; status: string; deadline: string | null;
  budget: number | null; spent: number | null; expenseTotal: number;
  clientName: string | null;
};

export type WorkDocumentInput = {
  id: string; title: string; type: string; status: string;
  createdAt: string; sentAt: string | null; approvedAt: string | null;
  convertedInvoiceId: string | null; total: number; currency: string;
  clientName: string | null;
};

const ACTIVE_PROJECT_STATUSES = ["planning", "active", "on_hold"];
const DEFAULT_LIMIT = 5;

/** Order carries the meaning: the closer to money, the higher up. */
const STAGE_ORDER: Record<WorkDocumentRow["stage"], number> = {
  awaiting_invoice: 0,
  awaiting_reply: 1,
  draft: 2,
};

function ageDays(fromIso: string, nowIso: string): number {
  const from = Date.parse(`${fromIso.slice(0, 10)}T00:00:00.000Z`);
  const now = Date.parse(`${nowIso.slice(0, 10)}T00:00:00.000Z`);
  return Math.max(0, Math.round((now - from) / 86_400_000));
}

function toProjectRow(project: WorkProjectInput, now: Date): WorkProjectRow {
  const deadline = parseDeadlineDate(project.deadline);
  const spent = resolveActualSpend(Number(project.spent ?? 0), project.expenseTotal);
  const budget = project.budget ?? null;

  return {
    id: project.id,
    title: project.title,
    clientName: project.clientName,
    deadlineIso: project.deadline,
    daysLabel: formatPipelineDaysLabel(deadline, now),
    risk: classifyProjectRisk(deadline, now),
    budget,
    spent,
    progress: budget && budget > 0 ? Math.min(1, spent / budget) : null,
  };
}

function toDocumentRow(
  document: WorkDocumentInput,
  nowIso: string,
): WorkDocumentRow | null {
  const base = {
    id: document.id,
    title: document.title,
    clientName: document.clientName,
    amount: document.total,
    currency: document.currency,
  };

  if (document.status === "approved" && document.approvedAt) {
    if (document.convertedInvoiceId) return null;
    return { ...base, stage: "awaiting_invoice", ageDays: ageDays(document.approvedAt, nowIso) };
  }

  if ((document.status === "sent" || document.status === "viewed") && document.sentAt) {
    return { ...base, stage: "awaiting_reply", ageDays: ageDays(document.sentAt, nowIso) };
  }

  if (document.status === "draft") {
    return { ...base, stage: "draft", ageDays: ageDays(document.createdAt, nowIso) };
  }

  return null;
}

/**
 * The slot swaps on data, never on plan: a paying user with no projects gets
 * documents-in-flight too, because that is what their work actually is.
 */
export function deriveWork(args: {
  nowIso: string;
  projects: WorkProjectInput[];
  documents: WorkDocumentInput[];
  limit?: number;
}): WorkFacts {
  const limit = args.limit ?? DEFAULT_LIMIT;
  const active = args.projects.filter((p) => ACTIVE_PROJECT_STATUSES.includes(p.status));

  if (active.length > 0) {
    const now = new Date(args.nowIso);
    const rows = active
      .map((project) => toProjectRow(project, now))
      .sort((a, b) => {
        if (a.deadlineIso && b.deadlineIso) return a.deadlineIso.localeCompare(b.deadlineIso);
        if (a.deadlineIso) return -1;
        if (b.deadlineIso) return 1;
        return a.title.localeCompare(b.title);
      });

    return { kind: "projects", projects: rows.slice(0, limit), totalCount: rows.length };
  }

  const rows = args.documents
    .map((document) => toDocumentRow(document, args.nowIso))
    .filter((row): row is WorkDocumentRow => row !== null)
    .sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || b.ageDays - a.ageDays);

  return { kind: "documents", documents: rows.slice(0, limit), totalCount: rows.length };
}
