// lib/projects/digest-facts.ts
//
// Deterministic risk signals and scoring for the Project Intelligence
// Agent. Zero imports — not even `import type` — so this file resolves
// identically under Node (Vitest) and Deno (the project-intelligence Edge
// Function) without an import map. Status fields are typed as `string`
// rather than importing the union types from `@/types`, which the Deno
// runtime cannot resolve.

export type DigestSeverity = "info" | "warning" | "critical";

export type DigestSignalKind =
  | "deadline_risk"
  | "overdue_tasks"
  | "idle_project"
  | "over_budget"
  | "budget_burn"
  | "payment_risk";

export type DigestSignal = {
  kind: DigestSignalKind;
  severity: DigestSeverity;
  title: string;
  detail: string;
};

export type DigestProjectInput = {
  id: string;
  title: string;
  /** planning | active | on_hold | completed | archived */
  status: string;
  /** date-only, e.g. "2026-08-15" */
  deadline: string | null;
  budget: number | null;
  updatedAt: string;
};

export type DigestTaskInput = {
  id: string;
  /** todo | in_progress | done | cancelled */
  status: string;
  dueDate: string | null;
  updatedAt: string;
};

export type DigestInvoiceInput = {
  id: string;
  projectId: string | null;
  /** draft | sent | viewed | signed | approved | paid | declined | partially_paid | written_off | voided | archived */
  status: string;
  dueDate: string | null;
  /** Outstanding balance (invoice total minus payments and write-offs), not the gross total. */
  total: number;
};

const SEVERITY_WEIGHT: Record<DigestSeverity, number> = {
  info: 5,
  warning: 20,
  critical: 40,
};

const HIGH_BAND_MIN = 60;
const MEDIUM_BAND_MIN = 25;

/** Unpaid invoice statuses that represent money genuinely at risk. */
const UNPAID_STATUSES = ["sent", "viewed", "partially_paid"];

/** Whole calendar days from `fromIso` to `toIso`. Negative when `toIso` is earlier. */
export function daysBetweenIso(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso.slice(0, 10)}T00:00:00.000Z`);
  const to = Date.parse(`${toIso.slice(0, 10)}T00:00:00.000Z`);
  return Math.round((to - from) / 86_400_000);
}

export function detectPaymentRisk(
  project: DigestProjectInput,
  invoices: DigestInvoiceInput[],
  nowIso: string,
): DigestSignal | null {
  if (project.status !== "active") return null;

  const unpaid = invoices.filter(
    (invoice) =>
      invoice.projectId === project.id && UNPAID_STATUSES.includes(invoice.status),
  );
  if (unpaid.length === 0) return null;

  const amountAtRisk = unpaid.reduce((sum, invoice) => sum + invoice.total, 0);

  let worstOverdueDays = 0;
  for (const invoice of unpaid) {
    if (!invoice.dueDate) continue;
    const overdueDays = daysBetweenIso(invoice.dueDate, nowIso);
    if (overdueDays > worstOverdueDays) worstOverdueDays = overdueDays;
  }

  const count = unpaid.length;
  const plural = count === 1 ? "" : "s";

  if (worstOverdueDays > 0) {
    return {
      kind: "payment_risk",
      severity: "critical",
      title: "Unpaid work",
      detail: `${count} unpaid invoice${plural} worth ${amountAtRisk}, oldest ${worstOverdueDays} days overdue, while the project is still active.`,
    };
  }

  return {
    kind: "payment_risk",
    severity: "info",
    title: "Invoices outstanding",
    detail: `${count} invoice${plural} worth ${amountAtRisk} is awaiting payment.`,
  };
}

export function scoreProjectHealth(signals: DigestSignal[]): {
  score: number;
  band: "low" | "medium" | "high";
} {
  const raw = signals.reduce((sum, signal) => sum + SEVERITY_WEIGHT[signal.severity], 0);
  const score = Math.min(100, raw);
  const band = score >= HIGH_BAND_MIN ? "high" : score >= MEDIUM_BAND_MIN ? "medium" : "low";
  return { score, band };
}

const DEADLINE_HORIZON_DAYS = 7;
const NEAR_DONE_PCT = 80;
const AT_RISK_PCT = 50;
const BUDGET_BURN_PCT = 80;
const IDLE_DAYS = 14;
const OVERDUE_CRITICAL_COUNT = 2;

const OPEN_TASK_STATUSES = ["todo", "in_progress"];

/** Returns null when there are no tasks to measure — treat as UNKNOWN, never as 100% complete. */
export function completionPct(tasks: DigestTaskInput[]): number | null {
  const counted = tasks.filter((task) => task.status !== "cancelled");
  if (counted.length === 0) return null;
  const done = counted.filter((task) => task.status === "done").length;
  return Math.round((done / counted.length) * 100);
}

export function detectDeadlineRisk(
  project: DigestProjectInput,
  tasks: DigestTaskInput[],
  nowIso: string,
): DigestSignal | null {
  if (project.status !== "active" || !project.deadline) return null;

  const daysLeft = daysBetweenIso(nowIso, project.deadline);
  if (daysLeft > DEADLINE_HORIZON_DAYS) return null;

  const pct = completionPct(tasks);
  const completionLabel = pct === null ? "completion unknown (no tasks tracked)" : `${pct}% complete`;

  if (daysLeft < 0) {
    if (pct !== null && pct >= 100) return null;
    return {
      kind: "deadline_risk",
      severity: "critical",
      title: "Deadline missed",
      detail: `${project.title} is ${Math.abs(daysLeft)} days overdue, ${completionLabel}.`,
    };
  }

  // pct === null (no tasks to measure) is UNKNOWN, not complete — always escalate.
  const severity: DigestSeverity =
    pct !== null && pct >= NEAR_DONE_PCT
      ? "info"
      : pct !== null && pct >= AT_RISK_PCT
        ? "warning"
        : "critical";

  const dayLabel = daysLeft === 1 ? "day" : "days";
  return {
    kind: "deadline_risk",
    severity,
    title: "Deadline approaching",
    detail: `${project.title} is due in ${daysLeft} ${dayLabel}, ${completionLabel}.`,
  };
}

export function detectBudgetSignal(
  project: DigestProjectInput,
  spent: number,
  nowIso: string,
): DigestSignal | null {
  void nowIso;
  if (project.budget === null || project.budget <= 0) return null;

  const burnPct = Math.round((spent / project.budget) * 100);

  if (burnPct >= 100) {
    return {
      kind: "over_budget",
      severity: "critical",
      title: "Over budget",
      detail: `${project.title} has spent ${burnPct}% of its budget.`,
    };
  }

  if (burnPct >= BUDGET_BURN_PCT) {
    return {
      kind: "budget_burn",
      severity: "warning",
      title: "Budget burning fast",
      detail: `${project.title} has spent ${burnPct}% of its budget.`,
    };
  }

  return null;
}

export function detectStaleness(
  project: DigestProjectInput,
  tasks: DigestTaskInput[],
  nowIso: string,
): DigestSignal[] {
  const signals: DigestSignal[] = [];

  const overdue = tasks.filter(
    (task) =>
      OPEN_TASK_STATUSES.includes(task.status) &&
      task.dueDate !== null &&
      daysBetweenIso(task.dueDate, nowIso) > 0,
  );

  if (overdue.length > 0) {
    const plural = overdue.length === 1 ? "" : "s";
    signals.push({
      kind: "overdue_tasks",
      severity: overdue.length > OVERDUE_CRITICAL_COUNT ? "critical" : "warning",
      title: "Overdue tasks",
      detail: `${overdue.length} task${plural} past due on ${project.title}.`,
    });
  }

  if (project.status === "active") {
    let latest = project.updatedAt;
    for (const task of tasks) {
      if (task.updatedAt > latest) latest = task.updatedAt;
    }
    const idleDays = daysBetweenIso(latest, nowIso);
    if (idleDays >= IDLE_DAYS) {
      signals.push({
        kind: "idle_project",
        severity: "warning",
        title: "Project looks idle",
        detail: `No updates on ${project.title} for ${idleDays} days.`,
      });
    }
  }

  return signals;
}

export type DigestProjectFact = {
  id: string;
  title: string;
  deadline: string | null;
  /** null when there are no tasks to measure — never fabricate 100% for the model. */
  completionPct: number | null;
  score: number;
  band: "low" | "medium" | "high";
  signals: DigestSignal[];
};

export type DigestFacts = {
  /** UTC date the digest covers, e.g. "2026-07-28" */
  generatedFor: string;
  currency: string;
  projects: DigestProjectFact[];
};

export function buildDigestFacts(args: {
  nowIso: string;
  currency: string;
  projects: DigestProjectInput[];
  tasksByProject: Record<string, DigestTaskInput[]>;
  spentByProject: Record<string, number>;
  invoices: DigestInvoiceInput[];
}): DigestFacts {
  const facts: DigestProjectFact[] = [];

  for (const project of args.projects) {
    const tasks = args.tasksByProject[project.id] ?? [];
    const spent = args.spentByProject[project.id] ?? 0;

    const signals: DigestSignal[] = [];

    const deadline = detectDeadlineRisk(project, tasks, args.nowIso);
    if (deadline) signals.push(deadline);

    signals.push(...detectStaleness(project, tasks, args.nowIso));

    const budget = detectBudgetSignal(project, spent, args.nowIso);
    if (budget) signals.push(budget);

    const payment = detectPaymentRisk(project, args.invoices, args.nowIso);
    if (payment) signals.push(payment);

    if (signals.length === 0) continue;

    const { score, band } = scoreProjectHealth(signals);
    facts.push({
      id: project.id,
      title: project.title,
      deadline: project.deadline,
      completionPct: completionPct(tasks),
      score,
      band,
      signals,
    });
  }

  facts.sort((a, b) => b.score - a.score);

  return {
    generatedFor: args.nowIso.slice(0, 10),
    currency: args.currency,
    projects: facts,
  };
}
