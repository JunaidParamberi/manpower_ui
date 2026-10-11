import type { NotificationEmailEventKey } from "@/lib/validations/notification-prefs";

export type NotificationEmailCategory =
  | "payments"
  | "client_responses"
  | "document_activity"
  | "tasks";

export type NotificationEmailCatalogItem = {
  id: NotificationEmailEventKey;
  label: string;
  description: string;
  category: NotificationEmailCategory;
  defaultEnabled: boolean;
  /** When false, toggle is shown but email dispatch is not wired yet. */
  emailSupported: boolean;
};

export const NOTIFICATION_EMAIL_CATEGORY_LABELS: Record<
  NotificationEmailCategory,
  string
> = {
  payments: "Payments",
  client_responses: "Client responses",
  document_activity: "Document activity",
  tasks: "Tasks",
};

export const NOTIFICATION_EMAIL_CATALOG: NotificationEmailCatalogItem[] = [
  {
    id: "invoice_paid",
    label: "Invoice paid",
    description: "Email when a client pays an invoice in full.",
    category: "payments",
    defaultEnabled: true,
    emailSupported: true,
  },
  {
    id: "invoice_overdue",
    label: "Invoice overdue",
    description: "Email when an invoice passes its due date unpaid.",
    category: "payments",
    defaultEnabled: true,
    emailSupported: false,
  },
  {
    id: "quote_approved",
    label: "Quote approved",
    description: "Email when a client approves a quote.",
    category: "client_responses",
    defaultEnabled: true,
    emailSupported: true,
  },
  {
    id: "quote_declined",
    label: "Quote declined",
    description: "Email when a client declines a quote.",
    category: "client_responses",
    defaultEnabled: true,
    emailSupported: true,
  },
  {
    id: "proposal_approved",
    label: "Proposal approved",
    description: "Email when a client approves a proposal.",
    category: "client_responses",
    defaultEnabled: true,
    emailSupported: true,
  },
  {
    id: "doc_sent",
    label: "Document sent",
    description: "Email when you send an invoice, quote, proposal, or LPO to a client.",
    category: "document_activity",
    defaultEnabled: false,
    emailSupported: true,
  },
  {
    id: "task_due",
    label: "Task due / overdue",
    description: "In-app notification when a task is due today or past its due date.",
    category: "tasks",
    defaultEnabled: true,
    emailSupported: false,
  },
];
