/**
 * What Kraft offers on a record page: the problems it can see (issues,
 * shown first and counted on the button) and a few useful next steps
 * (ideas). Pure and deterministic, no AI call: the page computes this from
 * data it already loaded. Clicking an item sends its `prompt` to the
 * assistant. Prompts name the record ("invoice INV-0008", "the client
 * \"Bright Apps Ltd\"") because some pages show a record inside a list view,
 * where the assistant can't tell from the URL which one is open.
 */

import type { HealthSignal } from "../clients/health-facts";
import { buildDigestFacts, type DigestInvoiceInput, type DigestSignal } from "../projects/digest-facts";
import type { AiPanelMode } from "../ai-panel/types";

export type RecordHelpItem = {
  id: string;
  tone: "issue" | "idea";
  title: string;
  detail: string;
  prompt: string;
  mode: AiPanelMode;
};

export type RecordHelp = {
  /** What the record is called on screen, e.g. "INV-0007" or "Bright Apps Ltd". */
  label: string;
  items: RecordHelpItem[];
};

export const MAX_HELP_ITEMS = 4;

export function issueCount(help: RecordHelp): number {
  return help.items.filter((item) => item.tone === "issue").length;
}

/** Swaps "this <noun>" in each prompt for the record's own name. */
function nameRecord(items: RecordHelpItem[], phrase: string, name: string): RecordHelpItem[] {
  const capital = phrase.charAt(0).toUpperCase() + phrase.slice(1);
  const named = name.charAt(0).toUpperCase() + name.slice(1);
  return items.map((item) => ({
    ...item,
    prompt: item.prompt.split(capital).join(named).split(phrase).join(name),
  }));
}

/** Issues first (in the order found), then ideas, deduplicated, capped. */
function finish(label: string, items: RecordHelpItem[]): RecordHelp {
  const seen = new Set<string>();
  const unique = items.filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
  const ordered = [...unique.filter((i) => i.tone === "issue"), ...unique.filter((i) => i.tone === "idea")];
  return { label, items: ordered.slice(0, MAX_HELP_ITEMS) };
}

const DOC_NOUN: Record<string, string> = {
  invoice: "invoice",
  quote: "quote",
  proposal: "proposal",
  local_purchase_order: "purchase order",
  receipt: "receipt",
};

export type DocumentHelpInput = {
  type: string;
  status: string;
  label: string;
  hasClient: boolean;
  lineItemCount: number;
  /** Every line item is priced at 0. */
  allZeroPriced: boolean;
  /** YYYY-MM-DD or null. */
  dueDate: string | null;
  validUntil: string | null;
  /** Outstanding balance on an invoice; null for other types. */
  balance: number | null;
  /** YYYY-MM-DD. */
  today: string;
};

const EDITABLE = new Set(["draft"]);
const OPEN_INVOICE = new Set(["sent", "viewed", "partially_paid"]);

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

export function documentHelp(input: DocumentHelpInput): RecordHelp {
  const noun = DOC_NOUN[input.type] ?? "document";
  const items: RecordHelpItem[] = [];
  const editable = EDITABLE.has(input.status);

  if (editable && !input.hasClient) {
    items.push({
      id: "no-client",
      tone: "issue",
      title: "Pick a client",
      detail: `This ${noun} isn't linked to a client yet`,
      prompt: `This ${noun} has no client. Work out which client it's for from the quote or project it references, its title and line items. If one clearly fits, set it. Otherwise offer me the likely clients to pick from.`,
      mode: "agent",
    });
  }
  if (editable && input.lineItemCount === 0) {
    items.push({
      id: "no-items",
      tone: "issue",
      title: "Add line items",
      detail: "There's nothing to charge for yet",
      prompt: `Add line items to this ${noun}. Use the quote or project it references, or this client's past documents and my services. If nothing fits, offer me the likely services to pick from.`,
      mode: "agent",
    });
  } else if (editable && input.allZeroPriced) {
    items.push({
      id: "zero-prices",
      tone: "issue",
      title: "Price the line items",
      detail: "Every line is priced at 0",
      prompt: `Every line on this ${noun} is priced at 0. Suggest prices from this client's past documents or my services, then update it.`,
      mode: "agent",
    });
  }
  if (input.type === "invoice" && !input.dueDate && (editable || OPEN_INVOICE.has(input.status))) {
    items.push({
      id: "no-due-date",
      tone: "issue",
      title: "Set the due date",
      detail: "Use the client's payment terms",
      prompt: "Set this invoice's due date from the client's payment terms (or Net-14 if they have none).",
      mode: "agent",
    });
  }
  if ((input.type === "quote" || input.type === "proposal") && editable && !input.validUntil) {
    items.push({
      id: "no-valid-until",
      tone: "issue",
      title: "Set how long it's valid",
      detail: `This ${noun} has no expiry date`,
      prompt: `Set this ${noun}'s valid-until date to 30 days from today.`,
      mode: "agent",
    });
  }
  if (
    input.type === "invoice" &&
    OPEN_INVOICE.has(input.status) &&
    input.dueDate &&
    input.dueDate < input.today &&
    (input.balance ?? 1) > 0
  ) {
    const days = daysBetween(input.dueDate, input.today);
    items.push({
      id: "overdue",
      tone: "issue",
      title: "Send a payment reminder",
      detail: `${days} ${days === 1 ? "day" : "days"} overdue`,
      prompt: "Draft a polite payment reminder for this invoice.",
      mode: "agent",
    });
  }

  if (editable) {
    items.push({
      id: "check",
      tone: "idea",
      title: `Check this ${noun} before sending`,
      detail: "Client, dates, line items and totals",
      prompt: `Check this ${noun} before I send it: client, dates, line items and totals. Tell me only what looks wrong.`,
      mode: "ask",
    });
  }
  if (input.type === "quote" && input.status === "approved") {
    items.push({
      id: "to-invoice",
      tone: "idea",
      title: "Turn this quote into an invoice",
      detail: "Same items, prices and client",
      prompt: "Turn this quote into an invoice.",
      mode: "agent",
    });
  }
  if (input.type === "invoice" && input.status === "paid") {
    items.push({
      id: "thanks",
      tone: "idea",
      title: "Send a thank-you note",
      detail: "Short and friendly",
      prompt: "Draft a short thank-you email to the client for paying this invoice.",
      mode: "agent",
    });
  }
  items.push({
    id: "summary",
    tone: "idea",
    title: `Summarise this ${noun}`,
    detail: "Who, what, how much, what's next",
    prompt: `Summarise this ${noun} in two sentences: who it's for, what it covers, the total and what happens next.`,
    mode: "ask",
  });

  return finish(input.label, nameRecord(items, `this ${noun}`, `${noun} ${input.label}`));
}

export type ClientHelpInput = {
  name: string;
  contactName: string | null;
  healthScore: number | null;
  signals: HealthSignal[];
};

const CLIENT_SIGNAL_PROMPT: Record<HealthSignal["kind"], (c: ClientHelpInput) => Omit<RecordHelpItem, "id" | "tone" | "title" | "detail">> = {
  overdue_invoices: () => ({ prompt: "Draft a polite payment reminder to this client for their overdue invoices.", mode: "agent" }),
  slow_payer: () => ({ prompt: "Look at how this client pays and suggest payment terms that would help.", mode: "ask" }),
  gone_quiet: (c) => ({
    prompt: `Draft a friendly check-in email to ${c.contactName ?? c.name} about how things are going and whether there's more I can help with.`,
    mode: "agent",
  }),
  no_active_work: (c) => ({
    prompt: `Draft a short email to ${c.contactName ?? c.name} offering a next project, based on the work we've done together.`,
    mode: "agent",
  }),
  revenue_decline: () => ({ prompt: "Why is revenue from this client down? Compare with earlier months.", mode: "ask" }),
  stalled_pipeline: () => ({ prompt: "Draft a follow-up on this client's open quotes and proposals.", mode: "agent" }),
};

export function clientHelp(input: ClientHelpInput): RecordHelp {
  const items: RecordHelpItem[] = input.signals
    .filter((signal) => signal.severity !== "info")
    .map((signal) => ({
      id: signal.kind,
      tone: "issue" as const,
      title: signal.title,
      detail: signal.detail,
      ...CLIENT_SIGNAL_PROMPT[signal.kind](input),
    }));

  if (input.healthScore !== null && input.signals.length > 0) {
    items.push({
      id: "explain-health",
      tone: "idea",
      title: `Why is their health ${input.healthScore}?`,
      detail: "What's pulling the score down",
      prompt: "Explain this client's health score in plain words and what would raise it.",
      mode: "ask",
    });
  }
  items.push(
    {
      id: "summary",
      tone: "idea",
      title: "Summarise this client",
      detail: "Revenue, projects, payment habits",
      prompt: "Summarise this client: total revenue, projects, how they pay and anything open.",
      mode: "ask",
    },
    {
      id: "new-quote",
      tone: "idea",
      title: "Draft a new quote",
      detail: `Based on past work for ${input.name}`,
      prompt: "Draft a new quote for this client based on the work and rates in their past documents. Ask what it's for if it isn't clear.",
      mode: "agent",
    },
  );
  return finish(input.name, nameRecord(items, "this client", `the client "${input.name}"`));
}

export type ProjectHelpInput = {
  title: string;
  status: string;
  signals: DigestSignal[];
};

const PROJECT_SIGNAL_PROMPT: Record<DigestSignal["kind"], Pick<RecordHelpItem, "prompt" | "mode">> = {
  deadline_risk: {
    prompt: "This project is at risk of missing its deadline. Plan the remaining tasks in a sensible order and set their due dates so it lands on time.",
    mode: "agent",
  },
  overdue_tasks: {
    prompt: "Some tasks on this project are overdue. Suggest new due dates for them, then update them.",
    mode: "agent",
  },
  idle_project: { prompt: "Nothing has moved on this project for a while. Which tasks are stuck, and what should I do next?", mode: "ask" },
  over_budget: { prompt: "This project is over budget. Where did the money go, and what should I tell the client?", mode: "ask" },
  budget_burn: { prompt: "How fast is this project burning its budget compared with how much is done?", mode: "ask" },
  payment_risk: { prompt: "Draft a polite payment reminder for this project's overdue invoices.", mode: "agent" },
};

export function projectHelp(input: ProjectHelpInput): RecordHelp {
  const items: RecordHelpItem[] = input.signals
    .filter((signal) => signal.severity !== "info")
    .map((signal) => ({
      id: signal.kind,
      tone: "issue" as const,
      title: signal.title,
      detail: signal.detail,
      ...PROJECT_SIGNAL_PROMPT[signal.kind],
    }));

  const active = input.status !== "completed" && input.status !== "archived";
  if (active) {
    items.push({
      id: "status-update",
      tone: "idea",
      title: "Write a status update for the client",
      detail: "What's done and what's next",
      prompt: "Draft a short status update email to this project's client: what's done, what's next and when.",
      mode: "agent",
    });
  }
  items.push(
    {
      id: "invoice-work",
      tone: "idea",
      title: "Invoice the work so far",
      detail: "From tracked time and the budget",
      prompt: "Draft an invoice for the work done on this project that hasn't been invoiced yet.",
      mode: "agent",
    },
    {
      id: "summary",
      tone: "idea",
      title: "Summarise this project",
      detail: "Progress, budget and risks",
      prompt: "Summarise this project: progress, budget used, what's at risk and what's next.",
      mode: "ask",
    },
  );
  return finish(input.title, nameRecord(items, "this project", `the project "${input.title}"`));
}

export type ProjectHelpData = {
  project: {
    id: string;
    title: string;
    status: string;
    deadline: string | null;
    budget: number | null;
    spent: number | null;
    updated_at: string;
  };
  tasks: Array<{ id: string; status: string; due_date: string | null; updated_at: string }>;
  expenses: Array<{ amount: number | string | null }>;
  invoices: DigestInvoiceInput[];
  nowIso: string;
  currency: string;
};

/**
 * Project help from the rows a project page already has, using the same
 * risk signals as the nightly digest. Spend is the expense total, or the
 * project's manual "spent" figure when there are no expenses (as the digest
 * does).
 */
export function projectHelpFromData(data: ProjectHelpData): RecordHelp {
  const expenseTotal = data.expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const { project } = data;
  const digest = buildDigestFacts({
    nowIso: data.nowIso,
    currency: data.currency,
    projects: [
      {
        id: project.id,
        title: project.title,
        status: project.status,
        deadline: project.deadline,
        budget: project.budget,
        updatedAt: project.updated_at,
      },
    ],
    tasksByProject: {
      [project.id]: data.tasks.map((task) => ({
        id: task.id,
        status: task.status,
        dueDate: task.due_date,
        updatedAt: task.updated_at,
      })),
    },
    spentByProject: { [project.id]: expenseTotal > 0 ? expenseTotal : Number(project.spent ?? 0) },
    invoices: data.invoices,
  });
  return projectHelp({ title: project.title, status: project.status, signals: digest.projects[0]?.signals ?? [] });
}
