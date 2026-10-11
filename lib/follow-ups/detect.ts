// lib/follow-ups/detect.ts
//
// Deterministic detection for the Follow-Up Engine. Zero imports — not even
// `import type` — so this file resolves identically under Node (Vitest) and
// Deno (the follow-up-engine Edge Function) without an import map. Status
// fields are typed as `string` rather than importing the union types from
// `@/types`, which the Deno runtime cannot resolve. Same constraints as
// lib/projects/digest-facts.ts.
//
// The ladder lives in ./ladder.ts, but this module cannot import it under Deno
// without an import map, so the rung offsets are duplicated here as LADDER.
// The two copies are pinned together by a parity test in detect.test.ts — edit
// one and that test fails until you edit the other.

export type FollowUpTrigger =
  | "invoice_overdue"
  | "invoice_due_soon"
  | "document_unanswered"
  | "project_stale";

export type FollowUpDocumentInput = {
  id: string;
  clientId: string | null;
  /** invoice | quote | proposal | lpo | receipt */
  type: string;
  /** draft | sent | viewed | signed | approved | paid | declined | partially_paid | written_off | voided | archived */
  status: string;
  /** Display number for the document's own type (invoice_number, quote_number, …). */
  number: string;
  currency: string;
  /** date-only, e.g. "2026-08-15" */
  dueDate: string | null;
  /** ISO timestamp, null when never sent */
  sentAt: string | null;
  updatedAt: string;
  /** Outstanding balance for invoices; gross total for quotes and proposals. */
  amount: number;
};

export type FollowUpProjectInput = {
  id: string;
  clientId: string | null;
  title: string;
  /** planning | active | on_hold | completed | archived */
  status: string;
  updatedAt: string;
  /** Newest task updated_at across the project, null when it has no tasks. */
  lastTaskActivityAt: string | null;
};

/** Rows already in the DB for this user, any status. */
export type ExistingFollowUp = {
  triggerType: string;
  subjectId: string;
  rung: number;
  /** pending | sent | dismissed | resolved */
  status: string;
};

export type FollowUpCandidate = {
  triggerType: FollowUpTrigger;
  subjectType: "document" | "project";
  subjectId: string;
  clientId: string | null;
  rung: number;
  /** Display-only snapshot. The drafter reloads live facts server-side. */
  facts: Record<string, string | number>;
};

export type FollowUpResolution = {
  subjectId: string;
  triggerType: FollowUpTrigger;
};

export type DetectResult = {
  candidates: FollowUpCandidate[];
  /** Pending rows whose underlying situation went away. */
  resolutions: FollowUpResolution[];
};

/** Offsets must stay in sync with FOLLOW_UP_LADDER in ./ladder.ts. */
export const LADDER: Record<FollowUpTrigger, number[]> = {
  invoice_overdue: [3, 10, 21],
  invoice_due_soon: [-3],
  document_unanswered: [5, 14],
  project_stale: [14, 30],
};

/** Unpaid invoice statuses that represent money genuinely at risk. */
const UNPAID_STATUSES = ["sent", "viewed", "partially_paid"];

/** Quote and proposal statuses that mean the client has not answered yet. */
const UNANSWERED_STATUSES = ["sent", "viewed"];

const UNANSWERABLE_TYPES = ["quote", "proposal"];

/** How far before the due date the due_soon nudge opens. */
const DUE_SOON_WINDOW_DAYS = 3;

/** Whole calendar days from `fromIso` to `toIso`. Negative when `toIso` is earlier. */
export function daysBetweenIso(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso.slice(0, 10)}T00:00:00.000Z`);
  const to = Date.parse(`${toIso.slice(0, 10)}T00:00:00.000Z`);
  return Math.round((to - from) / 86_400_000);
}

/**
 * Highest ladder rung reached for a given elapsed-day count, or null when even
 * the first rung is out of reach. Rungs are ascending, so the last one whose
 * offset is met wins.
 */
function highestReachedRung(trigger: FollowUpTrigger, elapsedDays: number): number | null {
  const offsets = LADDER[trigger];
  let reached: number | null = null;
  for (let index = 0; index < offsets.length; index += 1) {
    if (elapsedDays >= offsets[index]) reached = index;
  }
  return reached;
}

function existingKey(triggerType: string, subjectId: string): string {
  return `${triggerType}::${subjectId}`;
}

/** Latest ISO timestamp of the two, treating null as "no activity". */
function latestActivity(updatedAt: string, lastTaskActivityAt: string | null): string {
  if (!lastTaskActivityAt) return updatedAt;
  return Date.parse(lastTaskActivityAt) > Date.parse(updatedAt)
    ? lastTaskActivityAt
    : updatedAt;
}

function isChaseableInvoice(document: FollowUpDocumentInput): boolean {
  return (
    document.type === "invoice" &&
    UNPAID_STATUSES.indexOf(document.status) !== -1 &&
    document.amount > 0
  );
}

function isUnansweredDocument(document: FollowUpDocumentInput): boolean {
  return (
    UNANSWERABLE_TYPES.indexOf(document.type) !== -1 &&
    UNANSWERED_STATUSES.indexOf(document.status) !== -1
  );
}

function isStaleableProject(project: FollowUpProjectInput): boolean {
  // A project with no client has nobody to email.
  return project.status === "active" && project.clientId !== null;
}

export function detectFollowUps(input: {
  documents: FollowUpDocumentInput[];
  projects: FollowUpProjectInput[];
  existing: ExistingFollowUp[];
  nowIso: string;
}): DetectResult {
  const { documents, projects, existing, nowIso } = input;

  // Highest rung already recorded per (trigger, subject), any status. A
  // dismissed rung counts: dismissed means dismissed.
  const highestRecorded = new Map<string, number>();
  for (const row of existing) {
    const key = existingKey(row.triggerType, row.subjectId);
    const current = highestRecorded.get(key);
    if (current === undefined || row.rung > current) {
      highestRecorded.set(key, row.rung);
    }
  }

  const candidates: FollowUpCandidate[] = [];

  function push(candidate: FollowUpCandidate): void {
    const recorded = highestRecorded.get(
      existingKey(candidate.triggerType, candidate.subjectId),
    );
    // Never re-queue a recorded rung, and never step backwards down the ladder.
    if (recorded !== undefined && candidate.rung <= recorded) return;
    candidates.push(candidate);
  }

  for (const document of documents) {
    if (isChaseableInvoice(document) && document.dueDate) {
      const daysPastDue = daysBetweenIso(document.dueDate, nowIso);

      if (daysPastDue > 0) {
        const rung = highestReachedRung("invoice_overdue", daysPastDue);
        if (rung !== null) {
          push({
            triggerType: "invoice_overdue",
            subjectType: "document",
            subjectId: document.id,
            clientId: document.clientId,
            rung,
            facts: {
              documentNumber: document.number,
              documentType: document.type,
              currency: document.currency,
              amount: document.amount,
              daysOverdue: daysPastDue,
            },
          });
        }
      } else if (daysPastDue >= -DUE_SOON_WINDOW_DAYS) {
        // Due within the window and not yet past due. The upper bound is what
        // stops this firing forever once the invoice goes overdue.
        push({
          triggerType: "invoice_due_soon",
          subjectType: "document",
          subjectId: document.id,
          clientId: document.clientId,
          rung: 0,
          facts: {
            documentNumber: document.number,
            documentType: document.type,
            currency: document.currency,
            amount: document.amount,
            // Math.abs, not negation: -0 would render as "-0 days".
            daysUntilDue: Math.abs(daysPastDue),
          },
        });
      }
    }

    if (isUnansweredDocument(document)) {
      const reference = document.sentAt ?? document.updatedAt;
      const daysSinceSent = daysBetweenIso(reference, nowIso);
      const rung = highestReachedRung("document_unanswered", daysSinceSent);
      if (rung !== null) {
        push({
          triggerType: "document_unanswered",
          subjectType: "document",
          subjectId: document.id,
          clientId: document.clientId,
          rung,
          facts: {
            documentNumber: document.number,
            documentType: document.type,
            currency: document.currency,
            amount: document.amount,
            daysSinceSent,
          },
        });
      }
    }
  }

  for (const project of projects) {
    if (!isStaleableProject(project)) continue;

    const reference = latestActivity(project.updatedAt, project.lastTaskActivityAt);
    const daysIdle = daysBetweenIso(reference, nowIso);
    const rung = highestReachedRung("project_stale", daysIdle);
    if (rung === null) continue;

    push({
      triggerType: "project_stale",
      subjectType: "project",
      subjectId: project.id,
      clientId: project.clientId,
      rung,
      facts: {
        projectTitle: project.title,
        daysIdle,
      },
    });
  }

  return {
    candidates,
    resolutions: detectResolutions({ documents, projects, existing, nowIso }),
  };
}

/**
 * Pending rows whose underlying situation went away: the invoice got paid, the
 * proposal got answered, the project moved again, or the subject was deleted.
 * One resolution per (subject, trigger), not per rung.
 */
function detectResolutions(input: {
  documents: FollowUpDocumentInput[];
  projects: FollowUpProjectInput[];
  existing: ExistingFollowUp[];
  nowIso: string;
}): FollowUpResolution[] {
  const { documents, projects, existing, nowIso } = input;

  const documentsById = new Map<string, FollowUpDocumentInput>();
  for (const document of documents) documentsById.set(document.id, document);

  const projectsById = new Map<string, FollowUpProjectInput>();
  for (const project of projects) projectsById.set(project.id, project);

  const resolutions: FollowUpResolution[] = [];
  const seen = new Set<string>();

  for (const row of existing) {
    if (row.status !== "pending") continue;

    const trigger = row.triggerType as FollowUpTrigger;
    const key = existingKey(row.triggerType, row.subjectId);
    if (seen.has(key)) continue;

    if (!resolvesNow(trigger, row.subjectId)) continue;

    seen.add(key);
    resolutions.push({ subjectId: row.subjectId, triggerType: trigger });
  }

  return resolutions;

  function resolvesNow(trigger: FollowUpTrigger, subjectId: string): boolean {
    if (trigger === "project_stale") {
      const project = projectsById.get(subjectId);
      // Deleted, archived, completed, or handed to nobody — nothing to chase.
      if (!project || !isStaleableProject(project)) return true;

      const reference = latestActivity(project.updatedAt, project.lastTaskActivityAt);
      return highestReachedRung("project_stale", daysBetweenIso(reference, nowIso)) === null;
    }

    const document = documentsById.get(subjectId);
    if (!document) return true;

    if (trigger === "document_unanswered") {
      return !isUnansweredDocument(document);
    }

    // Both invoice triggers: paid, written off, voided, or fully settled.
    if (!isChaseableInvoice(document) || !document.dueDate) return true;

    const daysPastDue = daysBetweenIso(document.dueDate, nowIso);

    if (trigger === "invoice_due_soon") {
      // Once it is actually overdue, the due_soon nudge is obsolete — the
      // overdue ladder takes over.
      return daysPastDue > 0;
    }

    return highestReachedRung("invoice_overdue", daysPastDue) === null;
  }
}
