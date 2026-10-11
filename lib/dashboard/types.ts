export type DashboardCounts = {
  activeProjectsCount: number;
  nearingDeadlineCount: number;
};

export type AttentionItemType =
  | "overdue_invoice"
  | "overdue_task"
  | "expiring_quote"
  | "project_deadline"
  | "quote_no_response";

export type AttentionItem = {
  type: AttentionItemType;
  id: string;
  href: string;
  label: string;
  urgencyDays: number;
  /** Who the item is about, for the card subtitle and the actions menu. */
  clientId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
};

export type ActivityEventType =
  | "invoice_paid"
  | "doc_sent"
  | "quote_approved"
  | "quote_declined"
  | "project_status_changed";

export type ActivityEvent = {
  type: ActivityEventType;
  id: string;
  href: string;
  label: string;
  /** Bold actor: "Hawthorn & Co", "You", project name. */
  who: string;
  /** Muted verb + entity: "paid invoice INV-2051". */
  text: string;
  /** Optional money amount, in `currency` — never the profile's currency. */
  amount?: number | null;
  /** Currency of `amount`, taken from the document itself. */
  currency?: string | null;
  /** Optional non-money meta suffix: "Maple Co.", quote: "Love the timeline." */
  metaSuffix?: string | null;
  timestamp: Date | string;
};

export type PipelineProject = {
  id: string;
  title: string;
  clientName: string | null;
  deadline: Date | null;
  risk: "overdue" | "at_risk" | "watch" | "on_track";
  daysLabel: string;
  statusLabel: string;
  status: string;
  budget: number | null;
  spent: number | null;
  progress: number | null;
};

export type ActivePipelineResult = {
  projects: PipelineProject[];
  totalCount: number;
};
