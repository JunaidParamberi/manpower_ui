// lib/clients/health-facts.ts
//
// Deterministic health signals and scoring for the Relationship Manager
// Agent. Zero imports — not even `import type` — so this file resolves
// identically under Node (Vitest) and Deno (the relationship-manager-scan
// Edge Function) without an import map. Status fields are typed as `string`
// rather than importing the union types from `@/types`, which the Deno
// runtime cannot resolve.

export type HealthSeverity = "info" | "warning" | "critical";

export type HealthSignalKind =
  | "overdue_invoices"
  | "slow_payer"
  | "gone_quiet"
  | "revenue_decline"
  | "stalled_pipeline"
  | "no_active_work";

export type HealthSignal = {
  kind: HealthSignalKind;
  severity: HealthSeverity;
  title: string;
  detail: string;
};

export type HealthBand = "excellent" | "healthy" | "needs_attention" | "at_risk";

export type ClientHealthInput = {
  id: string;
  name: string;
  /** lead | active | paused | past | archived */
  relationshipStatus: string;
  paymentTermsDays: number | null;
};

export type HealthInvoiceInput = {
  id: string;
  /** draft | sent | viewed | signed | approved | paid | declined | partially_paid | written_off | voided | archived */
  status: string;
  dueDate: string | null;
  /** Outstanding balance for unpaid invoices; gross total for paid ones. */
  total: number;
  paidAt: string | null;
  /** Whole days from sent to paid; null when unknown. */
  daysToPay: number | null;
};

export type HealthProjectInput = {
  id: string;
  /** planning | active | on_hold | completed | archived */
  status: string;
  updatedAt: string;
};

export type HealthDocumentTouchInput = {
  sentAt: string | null;
  viewedAt: string | null;
  status: string;
  type: string;
};

export type ClientHealthFacts = {
  clientId: string;
  score: number;
  band: HealthBand;
  signals: HealthSignal[];
  computedAt: string;
};

const SEVERITY_WEIGHT: Record<HealthSeverity, number> = {
  info: 5,
  warning: 20,
  critical: 40,
};

/** Bands mirror lib/clients/display.ts healthPresentation() cuts — keep in sync. */
const EXCELLENT_MIN = 80;
const HEALTHY_MIN = 55;
const NEEDS_ATTENTION_MIN = 30;

const UNPAID_STATUSES = ["sent", "viewed", "partially_paid"];
const OPEN_QUOTE_PROPOSAL_STATUSES = ["sent", "viewed"];
const CHASEABLE_PIPELINE_TYPES = ["quote", "proposal"];
const SCORABLE_RELATIONSHIP_STATUSES = ["lead", "active", "paused"];

const OVERDUE_CRITICAL_COUNT = 2;
const OVERDUE_CRITICAL_DAYS = 60;
const SLOW_PAYER_GRACE_DAYS = 7;
const SLOW_PAYER_WARNING_MULTIPLIER = 2;
const SLOW_PAYER_TRAILING_COUNT = 5;
const GONE_QUIET_WARNING_DAYS = 45;
const GONE_QUIET_CRITICAL_DAYS = 90;
const REVENUE_DECLINE_RATIO = 0.5;
const STALLED_PIPELINE_INFO_DAYS = 14;
const STALLED_PIPELINE_WARNING_DAYS = 30;

/** Whole calendar days from `fromIso` to `toIso`. Negative when `toIso` is earlier. */
export function daysBetweenIso(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso.slice(0, 10)}T00:00:00.000Z`);
  const to = Date.parse(`${toIso.slice(0, 10)}T00:00:00.000Z`);
  return Math.round((to - from) / 86_400_000);
}

export function detectOverdueInvoices(
  invoices: HealthInvoiceInput[],
  nowIso: string,
): HealthSignal | null {
  const overdue = invoices.filter(
    (invoice) =>
      UNPAID_STATUSES.includes(invoice.status) &&
      invoice.dueDate !== null &&
      daysBetweenIso(invoice.dueDate, nowIso) > 0,
  );
  if (overdue.length === 0) return null;

  let worstOverdueDays = 0;
  for (const invoice of overdue) {
    const days = daysBetweenIso(invoice.dueDate as string, nowIso);
    if (days > worstOverdueDays) worstOverdueDays = days;
  }

  const critical = overdue.length >= OVERDUE_CRITICAL_COUNT || worstOverdueDays > OVERDUE_CRITICAL_DAYS;
  const plural = overdue.length === 1 ? "" : "s";

  return {
    kind: "overdue_invoices",
    severity: critical ? "critical" : "warning",
    title: "Overdue invoices",
    detail: `${overdue.length} unpaid invoice${plural}, oldest ${worstOverdueDays} days overdue.`,
  };
}

export function detectSlowPayer(
  invoices: HealthInvoiceInput[],
  paymentTermsDays: number | null,
): HealthSignal | null {
  const terms = paymentTermsDays ?? 14;

  const paid = invoices
    .filter((invoice) => invoice.status === "paid" && invoice.daysToPay !== null)
    .sort((a, b) => {
      const aDate = a.paidAt ?? "";
      const bDate = b.paidAt ?? "";
      return aDate.localeCompare(bDate);
    })
    .slice(-SLOW_PAYER_TRAILING_COUNT);
  if (paid.length === 0) return null;

  const avgDays =
    paid.reduce((sum, invoice) => sum + (invoice.daysToPay as number), 0) / paid.length;

  if (avgDays <= terms + SLOW_PAYER_GRACE_DAYS) return null;

  const severity: HealthSeverity =
    avgDays > terms * SLOW_PAYER_WARNING_MULTIPLIER ? "warning" : "info";

  return {
    kind: "slow_payer",
    severity,
    title: "Slow payer",
    detail: `Averaging ${Math.round(avgDays)} days to pay against ${terms}-day terms.`,
  };
}

export function detectGoneQuiet(
  documents: HealthDocumentTouchInput[],
  projects: HealthProjectInput[],
  lastTimeEntryIso: string | null,
  nowIso: string,
): HealthSignal | null {
  let latest: string | null = null;
  for (const doc of documents) {
    if (doc.sentAt && (!latest || doc.sentAt > latest)) latest = doc.sentAt;
    if (doc.viewedAt && (!latest || doc.viewedAt > latest)) latest = doc.viewedAt;
  }
  for (const project of projects) {
    if (!latest || project.updatedAt > latest) latest = project.updatedAt;
  }
  if (lastTimeEntryIso && (!latest || lastTimeEntryIso > latest)) latest = lastTimeEntryIso;

  if (!latest) return null;

  const idleDays = daysBetweenIso(latest, nowIso);
  if (idleDays < GONE_QUIET_WARNING_DAYS) return null;

  return {
    kind: "gone_quiet",
    severity: idleDays >= GONE_QUIET_CRITICAL_DAYS ? "critical" : "warning",
    title: "Gone quiet",
    detail: `No documents, project activity, or time entries in ${idleDays} days.`,
  };
}

export function detectRevenueDecline(
  revenueLast90: number,
  revenuePrior90: number,
): HealthSignal | null {
  if (revenuePrior90 <= 0) return null;
  if (revenueLast90 >= revenuePrior90 * REVENUE_DECLINE_RATIO) return null;

  return {
    kind: "revenue_decline",
    severity: revenueLast90 <= 0 ? "critical" : "warning",
    title: "Revenue declining",
    detail: `Paid revenue dropped from ${revenuePrior90} to ${revenueLast90} over the last 90 days.`,
  };
}

export function detectStalledPipeline(
  documents: HealthDocumentTouchInput[],
  nowIso: string,
): HealthSignal | null {
  const open = documents.filter(
    (doc) =>
      CHASEABLE_PIPELINE_TYPES.includes(doc.type) &&
      OPEN_QUOTE_PROPOSAL_STATUSES.includes(doc.status) &&
      doc.sentAt !== null,
  );
  if (open.length === 0) return null;

  let oldestDaysOpen = 0;
  for (const doc of open) {
    const days = daysBetweenIso(doc.sentAt as string, nowIso);
    if (days > oldestDaysOpen) oldestDaysOpen = days;
  }
  if (oldestDaysOpen < STALLED_PIPELINE_INFO_DAYS) return null;

  return {
    kind: "stalled_pipeline",
    severity: oldestDaysOpen >= STALLED_PIPELINE_WARNING_DAYS ? "warning" : "info",
    title: "Pipeline stalled",
    detail: `A quote or proposal has been open ${oldestDaysOpen} days with no response.`,
  };
}

export function detectNoActiveWork(
  projects: HealthProjectInput[],
  invoices: HealthInvoiceInput[],
): HealthSignal | null {
  const hasActiveProject = projects.some((project) => project.status === "active");
  if (hasActiveProject) return null;

  const hasUnpaidInvoice = invoices.some((invoice) => UNPAID_STATUSES.includes(invoice.status));
  if (hasUnpaidInvoice) return null;

  return {
    kind: "no_active_work",
    severity: "info",
    title: "No active work",
    detail: "No active project and no invoice awaiting payment.",
  };
}

export function scoreClientHealth(signals: HealthSignal[]): { score: number; band: HealthBand } {
  const raw = signals.reduce((sum, signal) => sum + SEVERITY_WEIGHT[signal.severity], 0);
  const score = Math.max(0, 100 - raw);
  const band: HealthBand =
    score >= EXCELLENT_MIN
      ? "excellent"
      : score >= HEALTHY_MIN
        ? "healthy"
        : score >= NEEDS_ATTENTION_MIN
          ? "needs_attention"
          : "at_risk";
  return { score, band };
}

export function buildClientHealthFacts(args: {
  client: ClientHealthInput;
  invoices: HealthInvoiceInput[];
  documents: HealthDocumentTouchInput[];
  projects: HealthProjectInput[];
  lastTimeEntryIso?: string | null;
  revenueLast90: number;
  revenuePrior90: number;
  nowIso: string;
}): ClientHealthFacts | null {
  if (!SCORABLE_RELATIONSHIP_STATUSES.includes(args.client.relationshipStatus)) {
    return null;
  }

  const hasPaidInvoice = args.invoices.some((invoice) => invoice.status === "paid");
  const hasSentDocument = args.documents.some((doc) => doc.sentAt !== null);
  const hasProject = args.projects.length > 0;
  if (!hasPaidInvoice && !hasSentDocument && !hasProject) {
    return null;
  }

  const signals: HealthSignal[] = [];

  const overdue = detectOverdueInvoices(args.invoices, args.nowIso);
  if (overdue) signals.push(overdue);

  const slowPayer = detectSlowPayer(args.invoices, args.client.paymentTermsDays);
  if (slowPayer) signals.push(slowPayer);

  const goneQuiet = detectGoneQuiet(
    args.documents,
    args.projects,
    args.lastTimeEntryIso ?? null,
    args.nowIso,
  );
  if (goneQuiet) signals.push(goneQuiet);

  const revenueDecline = detectRevenueDecline(args.revenueLast90, args.revenuePrior90);
  if (revenueDecline) signals.push(revenueDecline);

  const stalledPipeline = detectStalledPipeline(args.documents, args.nowIso);
  if (stalledPipeline) signals.push(stalledPipeline);

  const noActiveWork = detectNoActiveWork(args.projects, args.invoices);
  if (noActiveWork) signals.push(noActiveWork);

  const { score, band } = scoreClientHealth(signals);

  // Present the most severe signal first, regardless of detection order.
  const sortedSignals = [...signals].sort(
    (a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity],
  );

  return {
    clientId: args.client.id,
    score,
    band,
    signals: sortedSignals,
    computedAt: args.nowIso,
  };
}
