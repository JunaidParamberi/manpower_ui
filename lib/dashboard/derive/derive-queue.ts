import { partitionByDismissal, type DismissalRow } from "@/lib/dashboard/dismissals";
import type {
  QueueActionContext,
  QueueItem,
  QueueSignalType,
} from "@/lib/dashboard/snapshot-types";
import { formatCurrency } from "@/lib/utils/format";

export type QueueInvoiceInput = {
  id: string; number: string | null; dueDate: string | null; status: string;
  currency: string; total: number; paid: number; writtenOff: number;
  clientId: string | null; clientName: string | null; clientEmail: string | null;
};

export type QueueQuoteInput = {
  id: string; number: string | null; status: string; sentAt: string | null;
  validUntil: string | null; approvedAt: string | null; convertedInvoiceId: string | null;
  currency: string; total: number;
  clientId: string | null; clientName: string | null; clientEmail: string | null;
};

export type QueueDraftInput = {
  id: string; title: string; type: string; createdAt: string;
  currency: string; total: number;
  clientId: string | null; clientName: string | null; clientEmail: string | null;
};

export type QueueProjectInput = {
  id: string; title: string; deadline: string | null; status: string;
  clientId: string | null; clientName: string | null; clientEmail: string | null;
};

export type QueueTaskInput = {
  id: string; title: string; dueDate: string | null; status: string;
  projectId: string; projectTitle: string;
  clientId: string | null; clientName: string | null; clientEmail: string | null;
};

export type QueueFollowUpInput = {
  id: string; subjectId: string; subjectType: "document" | "project";
  triggerType: string; rung: number; tone: string;
  clientId: string | null; clientName: string | null; clientEmail: string | null;
};

/** How loudly a signal type shouts before recency is applied. */
const SEVERITY_WEIGHT: Record<QueueSignalType, number> = {
  follow_up_due: 100,
  overdue_invoice: 90,
  quote_not_invoiced: 70,
  expiring_quote: 60,
  overdue_task: 50,
  project_deadline: 45,
  quote_no_response: 40,
  draft_unsent: 25,
};

const QUOTE_EXPIRY_HORIZON_DAYS = 3;
const QUOTE_SILENCE_DAYS = 7;
const DRAFT_STALE_DAYS = 7;
const PROJECT_DEADLINE_HORIZON_DAYS = 7;
const DEFAULT_LIMIT = 6;

const OPEN_INVOICE_STATUSES = ["sent", "viewed", "partially_paid"];
const OPEN_TASK_STATUSES = ["todo", "in_progress"];
const DEADLINE_PROJECT_STATUSES = ["planning", "active"];

function dayStart(iso: string): number {
  return Date.parse(`${iso.slice(0, 10)}T00:00:00.000Z`);
}

/** Whole days from `fromIso` to `toIso`; negative when `toIso` is earlier. */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((dayStart(toIso) - dayStart(fromIso)) / 86_400_000);
}

/**
 * Age amplifies urgency but saturates — a 400-day-old invoice is not ten times
 * more urgent than a 40-day-old one, and without a ceiling one ancient row
 * would pin itself to the top of the queue forever.
 */
function decay(days: number): number {
  return 1 + Math.min(Math.max(days, 0), 90) / 45;
}

function emptyAction(): QueueActionContext {
  return {
    documentId: null,
    projectId: null,
    taskId: null,
    invoiceTotal: null,
    totalPaid: null,
    totalWrittenOff: null,
    remainingBalance: null,
    suggestedSubject: null,
    suggestedBody: null,
  };
}

function money(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function buildInvoiceItems(args: {
  invoices: QueueInvoiceInput[];
  nowIso: string;
}): QueueItem[] {
  const items: QueueItem[] = [];

  for (const invoice of args.invoices) {
    if (!OPEN_INVOICE_STATUSES.includes(invoice.status)) continue;
    if (!invoice.dueDate) continue;

    const daysOverdue = daysBetween(invoice.dueDate, args.nowIso);
    if (daysOverdue <= 0) continue;

    const balance = money(invoice.total - invoice.paid - invoice.writtenOff);
    if (balance <= 0) continue;

    items.push({
      type: "overdue_invoice",
      id: invoice.id,
      score: SEVERITY_WEIGHT.overdue_invoice * decay(daysOverdue),
      href: `/documents/${invoice.id}`,
      title: `Invoice #${invoice.number ?? "—"}`,
      detail: `${plural(daysOverdue, "day")} overdue`,
      amount: balance,
      currency: invoice.currency,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      action: {
        ...emptyAction(),
        documentId: invoice.id,
        invoiceTotal: invoice.total,
        totalPaid: invoice.paid,
        totalWrittenOff: invoice.writtenOff,
        remainingBalance: balance,
        suggestedSubject: `Invoice ${invoice.number ?? ""} — payment reminder`.trim(),
        suggestedBody:
          `Hi ${invoice.clientName ?? "there"},\n\n` +
          `Invoice ${invoice.number ?? ""} for ${formatCurrency(balance, invoice.currency)} ` +
          `is now ${plural(daysOverdue, "day")} past its due date. ` +
          `Could you let me know when it's scheduled for payment?\n\nThank you.`,
      },
    });
  }

  return items;
}

function buildQuoteItems(args: { quotes: QueueQuoteInput[]; nowIso: string }): QueueItem[] {
  const items: QueueItem[] = [];

  for (const quote of args.quotes) {
    const base = {
      id: quote.id,
      href: `/documents/${quote.id}`,
      title: `Quote #${quote.number ?? "—"}`,
      amount: quote.total,
      currency: quote.currency,
      clientId: quote.clientId,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
    };

    // Approved but never invoiced outranks every other quote state: it is
    // money the client already agreed to pay.
    if (quote.status === "approved" && quote.approvedAt && !quote.convertedInvoiceId) {
      const days = daysBetween(quote.approvedAt, args.nowIso);
      items.push({
        ...base,
        type: "quote_not_invoiced",
        score: SEVERITY_WEIGHT.quote_not_invoiced * decay(days),
        detail: `approved ${plural(days, "day")} ago, not invoiced`,
        action: { ...emptyAction(), documentId: quote.id },
      });
      continue;
    }

    if (quote.status !== "sent") continue;

    if (quote.validUntil) {
      const daysLeft = daysBetween(args.nowIso, quote.validUntil);
      if (daysLeft >= 0 && daysLeft <= QUOTE_EXPIRY_HORIZON_DAYS) {
        items.push({
          ...base,
          type: "expiring_quote",
          score: SEVERITY_WEIGHT.expiring_quote * decay(QUOTE_EXPIRY_HORIZON_DAYS - daysLeft),
          detail: daysLeft === 0 ? "expires today" : `expires in ${plural(daysLeft, "day")}`,
          action: {
            ...emptyAction(),
            documentId: quote.id,
            suggestedSubject: `Quote ${quote.number ?? ""} expires soon`.trim(),
            suggestedBody:
              `Hi ${quote.clientName ?? "there"},\n\n` +
              `Quote ${quote.number ?? ""} expires shortly. ` +
              `Happy to extend it or answer any questions.\n\nThank you.`,
          },
        });
        continue;
      }
    }

    if (quote.sentAt) {
      const daysSince = daysBetween(quote.sentAt, args.nowIso);
      if (daysSince > QUOTE_SILENCE_DAYS) {
        items.push({
          ...base,
          type: "quote_no_response",
          score: SEVERITY_WEIGHT.quote_no_response * decay(daysSince),
          detail: `no response in ${plural(daysSince, "day")}`,
          action: {
            ...emptyAction(),
            documentId: quote.id,
            suggestedSubject: `Following up on quote ${quote.number ?? ""}`.trim(),
            suggestedBody:
              `Hi ${quote.clientName ?? "there"},\n\n` +
              `Just checking in on quote ${quote.number ?? ""} — ` +
              `any questions I can help with?\n\nThank you.`,
          },
        });
      }
    }
  }

  return items;
}

function buildDraftItems(args: { drafts: QueueDraftInput[]; nowIso: string }): QueueItem[] {
  const items: QueueItem[] = [];

  for (const draft of args.drafts) {
    const ageDays = daysBetween(draft.createdAt, args.nowIso);
    if (ageDays <= DRAFT_STALE_DAYS) continue;

    items.push({
      type: "draft_unsent",
      id: draft.id,
      score: SEVERITY_WEIGHT.draft_unsent * decay(ageDays),
      href: `/documents/${draft.id}`,
      title: draft.title,
      detail: `draft, unsent for ${plural(ageDays, "day")}`,
      amount: draft.total,
      currency: draft.currency,
      clientId: draft.clientId,
      clientName: draft.clientName,
      clientEmail: draft.clientEmail,
      action: { ...emptyAction(), documentId: draft.id },
    });
  }

  return items;
}

function buildProjectItems(args: { projects: QueueProjectInput[]; nowIso: string }): QueueItem[] {
  const items: QueueItem[] = [];

  for (const project of args.projects) {
    if (!DEADLINE_PROJECT_STATUSES.includes(project.status)) continue;
    if (!project.deadline) continue;

    const daysLeft = daysBetween(args.nowIso, project.deadline);
    if (daysLeft < 0 || daysLeft > PROJECT_DEADLINE_HORIZON_DAYS) continue;

    items.push({
      type: "project_deadline",
      id: project.id,
      score: SEVERITY_WEIGHT.project_deadline * decay(PROJECT_DEADLINE_HORIZON_DAYS - daysLeft),
      href: `/projects/${project.id}`,
      title: project.title,
      detail: daysLeft === 0 ? "due today" : `due in ${plural(daysLeft, "day")}`,
      amount: null,
      currency: null,
      clientId: project.clientId,
      clientName: project.clientName,
      clientEmail: project.clientEmail,
      action: { ...emptyAction(), projectId: project.id },
    });
  }

  return items;
}

function buildTaskItems(args: { tasks: QueueTaskInput[]; nowIso: string }): QueueItem[] {
  const items: QueueItem[] = [];

  for (const task of args.tasks) {
    if (!OPEN_TASK_STATUSES.includes(task.status)) continue;
    if (!task.dueDate) continue;

    const daysOverdue = daysBetween(task.dueDate, args.nowIso);
    if (daysOverdue <= 0) continue;

    items.push({
      type: "overdue_task",
      id: task.id,
      score: SEVERITY_WEIGHT.overdue_task * decay(daysOverdue),
      href: `/projects/${task.projectId}`,
      title: task.title,
      detail: `${task.projectTitle} · ${plural(daysOverdue, "day")} overdue`,
      amount: null,
      currency: null,
      clientId: task.clientId,
      clientName: task.clientName,
      clientEmail: task.clientEmail,
      action: { ...emptyAction(), projectId: task.projectId, taskId: task.id },
    });
  }

  return items;
}

function buildFollowUpItems(args: {
  followUps: QueueFollowUpInput[];
  invoices: QueueInvoiceInput[];
  nowIso: string;
}): QueueItem[] {
  const invoiceById = new Map(args.invoices.map((invoice) => [invoice.id, invoice]));

  return args.followUps.map((followUp) => {
    const invoice = invoiceById.get(followUp.subjectId);
    const balance = invoice
      ? money(invoice.total - invoice.paid - invoice.writtenOff)
      : null;

    return {
      type: "follow_up_due" as const,
      id: followUp.subjectId,
      score: SEVERITY_WEIGHT.follow_up_due * decay(followUp.rung * 15),
      href:
        followUp.subjectType === "document"
          ? `/documents/${followUp.subjectId}`
          : `/projects/${followUp.subjectId}`,
      title: invoice ? `Invoice #${invoice.number ?? "—"}` : "Follow-up due",
      detail: `follow-up ${followUp.rung} · ${followUp.tone}`,
      amount: balance,
      currency: invoice?.currency ?? null,
      clientId: followUp.clientId,
      clientName: followUp.clientName,
      clientEmail: followUp.clientEmail,
      action: {
        ...emptyAction(),
        documentId: followUp.subjectType === "document" ? followUp.subjectId : null,
        projectId: followUp.subjectType === "project" ? followUp.subjectId : null,
        invoiceTotal: invoice?.total ?? null,
        totalPaid: invoice?.paid ?? null,
        totalWrittenOff: invoice?.writtenOff ?? null,
        remainingBalance: balance,
      },
    };
  });
}

/**
 * One card per subject. A follow-up rung and a raw overdue invoice describe the
 * same debt, and the rung carries the escalation tone, so it wins.
 */
function dedupeBySubject(items: QueueItem[]): QueueItem[] {
  const bySubject = new Map<string, QueueItem>();

  for (const item of items) {
    const existing = bySubject.get(item.id);
    if (!existing || item.score > existing.score) {
      bySubject.set(item.id, item);
    }
  }

  return [...bySubject.values()];
}

export function deriveQueue(args: {
  nowIso: string;
  invoices: QueueInvoiceInput[];
  quotes: QueueQuoteInput[];
  drafts: QueueDraftInput[];
  projects: QueueProjectInput[];
  tasks: QueueTaskInput[];
  followUps: QueueFollowUpInput[];
  dismissals: DismissalRow[];
  limit?: number;
}): { items: QueueItem[]; snoozedCount: number } {
  const all = [
    ...buildInvoiceItems({ invoices: args.invoices, nowIso: args.nowIso }),
    ...buildQuoteItems({ quotes: args.quotes, nowIso: args.nowIso }),
    ...buildDraftItems({ drafts: args.drafts, nowIso: args.nowIso }),
    ...buildProjectItems({ projects: args.projects, nowIso: args.nowIso }),
    ...buildTaskItems({ tasks: args.tasks, nowIso: args.nowIso }),
    ...buildFollowUpItems({
      followUps: args.followUps,
      invoices: args.invoices,
      nowIso: args.nowIso,
    }),
  ];

  const deduped = dedupeBySubject(all).sort((a, b) => b.score - a.score);
  const { active, snoozedCount } = partitionByDismissal(deduped, args.dismissals, args.nowIso);

  return { items: active.slice(0, args.limit ?? DEFAULT_LIMIT), snoozedCount };
}
