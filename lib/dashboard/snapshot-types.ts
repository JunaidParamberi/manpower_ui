import type { CurrencyBreakdown } from "@/lib/finance/summary-calc";
import type { MonthlyRevenuePoint } from "@/lib/finance/types";
import type { ActivityEvent } from "@/lib/dashboard/types";
import type { HealthBand, HealthSignal } from "@/lib/clients/health-facts";

export type QueueSignalType =
  | "overdue_invoice"
  | "expiring_quote"
  | "quote_no_response"
  | "quote_not_invoiced"
  | "draft_unsent"
  | "project_deadline"
  | "overdue_task"
  | "follow_up_due";

/** Everything an inline action needs, so the card never re-queries. */
export type QueueActionContext = {
  documentId: string | null;
  projectId: string | null;
  taskId: string | null;
  /** Invoice money, for the record-payment dialog. Null for non-invoices. */
  invoiceTotal: number | null;
  totalPaid: number | null;
  totalWrittenOff: number | null;
  remainingBalance: number | null;
  /** Prefill for the email composer. */
  suggestedSubject: string | null;
  suggestedBody: string | null;
};

export type QueueItem = {
  type: QueueSignalType;
  /** Subject row id — invoice, quote, task or project. */
  id: string;
  score: number;
  href: string;
  /** "Invoice #INV-2051" */
  title: string;
  /** "12 days overdue" */
  detail: string;
  amount: number | null;
  currency: string | null;
  clientId: string | null;
  clientName: string | null;
  clientEmail: string | null;
  action: QueueActionContext;
};

export type MoneyFacts = {
  primaryCurrency: string;
  totalRevenue: number;
  outstanding: number;
  overdue: number;
  outstandingCount: number;
  overdueCount: number;
  avgPayDays: number | null;
  revenueChangePct: number | null;
  byCurrency: CurrencyBreakdown[];
};

export type BriefLine = {
  id: string;
  title: string;
  detail: string;
  href: string | null;
  band: "low" | "medium" | "high";
};

export type BriefFacts = {
  /** Present only when a narrated digest exists. Renders with AI attribution. */
  narrative: string | null;
  digestDate: string | null;
  lines: BriefLine[];
  /** True on plans the nightly agents skip — drives the single upsell line. */
  showUpgradeHint: boolean;
};

export type WorkProjectRow = {
  id: string;
  title: string;
  clientName: string | null;
  deadlineIso: string | null;
  daysLabel: string;
  risk: "overdue" | "at_risk" | "watch" | "on_track";
  budget: number | null;
  spent: number;
  progress: number | null;
};

export type WorkDocumentRow = {
  id: string;
  title: string;
  clientName: string | null;
  stage: "draft" | "awaiting_reply" | "awaiting_invoice";
  ageDays: number;
  amount: number | null;
  currency: string | null;
};

export type WorkFacts =
  | { kind: "projects"; projects: WorkProjectRow[]; totalCount: number }
  | { kind: "documents"; documents: WorkDocumentRow[]; totalCount: number };

export type ClientRow = {
  clientId: string;
  clientName: string;
  score: number;
  band: HealthBand;
  topSignal: HealthSignal | null;
};

export type ClientFacts = {
  clients: ClientRow[];
  /** True when there are more clients than we compute live for. */
  cappedForLiveComputation: boolean;
  /** "nightly" when from snapshots, "live" when computed this request. */
  source: "nightly" | "live";
};

export type DashboardSnapshot = {
  currency: string;
  profileCurrency: string;
  money: MoneyFacts;
  queue: QueueItem[];
  snoozedCount: number;
  revenue: MonthlyRevenuePoint[];
  activity: ActivityEvent[];
  work: WorkFacts;
  brief: BriefFacts;
  clients: ClientFacts;
};
