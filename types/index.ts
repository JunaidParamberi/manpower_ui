/**
 * Row shape for `public.profiles` (see supabase/migrations/*_profiles.sql).
 */
export type ProfileRow = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  vat_registered: boolean;
  vat_number: string | null;
  gstin: string | null;
  vat_reg_no: string | null;
  upi_id: string | null;
  default_tds_rate: number;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_region: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  default_currency: string;
  default_tax_mode: string;
  default_tax_rate: number;
  brand_kit_id: string | null;
  plan_tier: "free" | "starter" | "pro" | "agency";
  onboarding_brand_skipped: boolean;
  onboarding_completed_at: string | null;
  terms_accepted_at: string | null;
  terms_version: string | null;
  privacy_accepted_at: string | null;
  privacy_version: string | null;
  cookie_analytics: boolean;
  cookie_marketing: boolean;
  cookie_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Row shape for `public.brand_kits` (see supabase/migrations/*_brand_kits.sql).
 */
export type BrandKitRow = {
  id: string;
  user_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font: string;
  email_signature: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Row shape for `public.clients` (see supabase/migrations/*_clients.sql).
 */
export type ClientRelationshipStatus =
  | "lead"
  | "active"
  | "paused"
  | "past"
  | "archived";

export type ClientPreferredContactMethod =
  | "email"
  | "phone"
  | "whatsapp"
  | "none";

export type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  contact_name: string | null;
  website: string | null;
  email: string | null;
  billing_email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  currency: string | null;
  tax_id: string | null;
  payment_terms_days: number | null;
  relationship_status: ClientRelationshipStatus;
  lead_source: string | null;
  preferred_contact_method: ClientPreferredContactMethod | null;
  timezone: string | null;
  tags: string[];
  notes: string | null;
  health_score: number | null;
  portal_token: string | null;
  created_at: string;
  updated_at: string;
};

/** Row shape for `public.suppliers`. */
export type SupplierRow = {
  id: string;
  user_id: string;
  name: string;
  supplier_code: string | null;
  license_number: string | null;
  vat_number: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  trade_license_document_url: string | null;
  vat_registration_document_url: string | null;
  created_at: string;
  updated_at: string;
};

/** Row shape for `public.project_clients`. */
export type ProjectClientRow = {
  id: string;
  user_id: string;
  name: string;
  client_code: string | null;
  license_number: string | null;
  vat_number: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  trade_license_document_url: string | null;
  vat_registration_document_url: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkerStatus = "available" | "deployed" | "on_leave" | "inactive";

/** Row shape for `public.workers`. */
export type WorkerRow = {
  id: string;
  user_id: string;
  employee_id: string;
  name: string;
  nationality: string | null;
  trade_category: string | null;
  status: WorkerStatus;
  supplier_id: string | null;
  notes: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  passport_document_url: string | null;
  passport_document_optional_url: string | null;
  emirates_id: string | null;
  emirates_id_expiry: string | null;
  emirates_id_document_url: string | null;
  emirates_id_document_optional_url: string | null;
  visa_number: string | null;
  visa_expiry: string | null;
  visa_document_url: string | null;
  visa_document_optional_url: string | null;
  medical_fit: boolean;
  medical_expiry: string | null;
  has_insurance: boolean;
  insurance_expiry: string | null;
  photo_url: string | null;
  workmen_compensation_document_url: string | null;
  workmen_compensation_document_optional_url: string | null;
  medical_insurance_card_url: string | null;
  medical_insurance_card_optional_url: string | null;
  noc_current_sponsor_document_url: string | null;
  noc_client_document_url: string | null;
  trade_license_document_url: string | null;
  created_at: string;
  updated_at: string;
};

/** Row shape for `public.worker_clients`. */
export type WorkerClientRow = {
  id: string;
  user_id: string;
  worker_id: string;
  project_client_id: string;
  created_at: string;
  updated_at: string;
};

export type WorkerDocumentCategory = "cicpa" | "additional";

/** Row shape for `public.worker_documents`. */
export type WorkerDocumentRow = {
  id: string;
  user_id: string;
  worker_id: string;
  category: WorkerDocumentCategory;
  label: string;
  file_url: string;
  created_at: string;
  updated_at: string;
};

/** Worker row with its linked supplier name and project-client names for list/detail UI. */
export type WorkerListRow = WorkerRow & {
  supplier: { id: string; name: string } | null;
  clients: { id: string; name: string }[];
};

/** Matches `projects_status_check` in `*_projects_tasks.sql`. */
export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";

/**
 * Row shape for `public.projects` (see supabase/migrations/*_projects_tasks.sql).
 */
export type ProjectRow = {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  status: ProjectStatus;
  budget: number | null;
  spent: number | null;
  hourly_rate: number | null;
  start_date: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

/** Project row with embedded CRM client (see `listProjects` / `getProjectById` select). */
export type ProjectListRow = ProjectRow & {
  client: { id: string; name: string } | null;
};

/** Row shape for `public.project_templates` (see supabase/migrations/*_project_templates.sql). */
export type ProjectTemplateRow = {
  id: string;
  user_id: string | null;
  is_system: boolean;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

/** Template row with milestone and task counts for list/card UI. */
export type ProjectTemplateSummaryRow = ProjectTemplateRow & {
  milestone_count: number;
  task_count: number;
};

/** Template milestone within a project template. */
export type ProjectTemplateMilestoneRow = {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  client_visible: boolean;
  created_at: string;
  updated_at: string;
};

/** Template task within a project template. */
export type ProjectTemplateTaskRow = {
  id: string;
  template_id: string;
  milestone_template_id: string | null;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  sort_order: number;
  client_visible: boolean;
  created_at: string;
  updated_at: string;
};

/** Project template with nested milestones and tasks. */
export type ProjectTemplateWithDetails = ProjectTemplateRow & {
  milestones: ProjectTemplateMilestoneRow[];
  tasks: ProjectTemplateTaskRow[];
};

export type ProjectMilestoneStatus =
  | "upcoming"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ProjectMilestoneRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: ProjectMilestoneStatus;
  due_date: string | null;
  sort_order: number;
  client_visible: boolean;
  created_at: string;
  updated_at: string;
};

/** Matches `tasks_status_check` in `*_projects_tasks.sql`. */
export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";

/** Matches `tasks_priority_check` in `*_projects_tasks.sql`. */
export type TaskPriority = "low" | "medium" | "high";

/**
 * Row shape for `public.tasks` (see supabase/migrations/*_projects_tasks.sql).
 */
export type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  priority: TaskPriority;
  labels: string[];
  description: string | null;
  start_date: string | null;
  completed_at: string | null;
  estimated_minutes: number | null;
  sort_order: number;
  client_visible: boolean;
  parent_task_id: string | null;
  milestone_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskCommentRow = {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  client_visible: boolean;
  created_at: string;
  updated_at: string;
};

/** Task with embedded project (and client) for `/tasks` list. */
export type TaskListRow = TaskRow & {
  project: {
    id: string;
    title: string;
    client: { id: string; name: string } | null;
  };
};

/**
 * Row shape for `public.time_entries` (see supabase/migrations/*_time_entries.sql).
 */
export type TimeEntryRow = {
  id: string;
  user_id: string;
  project_id: string;
  task_id: string | null;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  paused_at: string | null;
  total_paused_seconds: number;
  duration_seconds: number | null;
  billed: boolean;
  invoice_line_item_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Time entry with joined project/task/billing fields from list queries. */
export type TimeEntryListRow = TimeEntryRow & {
  project: {
    id: string;
    title: string;
    client_id: string | null;
    hourly_rate: number | null;
  } | null;
  task: { id: string; title: string } | null;
};

/** Matches `expenses_category_check` in `*_expenses.sql`. */
export type ExpenseCategory =
  | "housing"
  | "software"
  | "travel"
  | "meals"
  | "marketing"
  | "other";

/**
 * Row shape for `public.expenses` (see supabase/migrations/*_expenses.sql).
 */
export type ExpenseRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  vendor: string | null;
  notes: string | null;
  /** @deprecated Use receipt_urls. Kept for legacy rows until column is dropped. */
  receipt_url: string | null;
  receipt_urls: string[];
  created_at: string;
  updated_at: string;
};

/** Expense row with optional joined project title from list queries. */
export type ExpenseListRow = ExpenseRow & {
  project: { id: string; title: string } | null;
};

/** Matches `document_type` enum in `*_documents.sql`. */
export type DocumentType = "proposal" | "quote" | "invoice" | "receipt" | "local_purchase_order" | "other" | "statement" | "credit_note" | "delivery_note";

/** Matches `document_status` enum in `*_documents.sql`. */
export type DocumentStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "signed"
  | "paid"
  | "partially_paid"
  | "written_off"
  | "archived"
  | "approved"
  | "declined"
  | "voided";

/**
 * Tiptap JSON document shape. Loosely typed; full validation happens inside
 * the editor. Stored verbatim in `documents.content_json` / `document_templates.content_json`.
 */
export type TiptapDoc = {
  type: string;
  content?: TiptapNode[];
  [key: string]: unknown;
};

export type TiptapNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  [key: string]: unknown;
};

export type ProposalDeliverable = {
  num: string;
  name: string;
  description?: string | null;
  hours?: number | null;
};

export type ProposalTimelinePhase = {
  name: string;
  start_week: number;
  span_weeks: number;
  color?: "accent" | "dark" | "soft" | "ghost";
};

export type ProposalContent = {
  headline?: string | null;
  headline_accent?: string | null;
  subhead?: string | null;
  investment_range?: string | null;
  opportunity?: string | null;
  opportunity_detail?: string | null;
  deliverables?: ProposalDeliverable[];
  timeline?: ProposalTimelinePhase[];
  timeline_weeks?: number;
  milestones?: string[];
  next_step_text?: string | null;
};

/**
 * Row shape for `public.documents` (see supabase/migrations/*_documents.sql).
 */
export type DocumentRow = {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  type: DocumentType;
  status: DocumentStatus;
  title: string;
  /** True while the title is generated automatically (see lib/documents/auto-title.ts). */
  title_is_auto: boolean;
  content_json: TiptapDoc;
  pdf_url: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  invoice_number: string | null;
  due_date: string | null;
  payment_terms: string | null;
  notes_footer: string | null;
  paid_at: string | null;
  pay_token: string | null;
  discount_value: number;
  discount_type: 'percent' | 'flat';
  quote_number: string | null;
  proposal_number: string | null;
  valid_until: string | null;
  approval_token: string | null;
  approved_at: string | null;
  declined_at: string | null;
  approval_message: string | null;
  approval_recipient_email: string | null;
  approval_otp: string | null;
  approval_otp_expires_at: string | null;
  approved_by_email: string | null;
  receipt_number: string | null;
  source_document_id: string | null;
  payment_id: string | null;
  lpo_number: string | null;
  lpo_validity_date: string | null;
  lpo_amount: number | null;
  lpo_pdf_url: string | null;
  lpo_reference_number: string | null;
  proposal_content: ProposalContent | null;
  tax_mode: "none" | "vat" | "gst" | "cgst_sgst" | "igst";
  tax_rate: number;
  currency: string;
  fx_rate: number | null;
  tds_enabled: boolean;
  tds_rate: number;
  tds_certificate_url: string | null;
  recurring_invoice_id: string | null;
  created_at: string;
  updated_at: string;
  issued_at: string | null;
  deleted_at: string | null;
  internal_notes: string | null;
  void_reason: string | null;
};

/** Document row with joined client/project labels from list queries. */
export type DocumentListRow = DocumentRow & {
  client: { id: string; name: string; currency: string } | null;
  project: { id: string; title: string } | null;
  total_amount: number | null;
  /** Sum of recorded payments; set only by queries that load payments (e.g. listDocumentsForClient). */
  amount_paid?: number;
};

/**
 * Row shape for `public.line_items` (see supabase/migrations/*_invoice_line_items.sql).
 */
export type LineItemRow = {
  id: string;
  document_id: string;
  description: string;
  notes: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  sort_order: number;
  hsn_sac_code: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Row shape for `public.services` (see supabase/migrations/20260627120000_services_catalog.sql).
 */
export type ServiceType = "service" | "product" | "asset";

export type ServiceUnit =
  | "hr" | "day" | "week" | "month"
  | "project" | "word" | "page" | "item"
  | "license" | "seat" | "gb";

export type ServiceRow = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  service_type: ServiceType;
  unit: ServiceUnit;
  sku: string | null;
  default_qty: number;
  cost_price: number | null;
  default_rate: number;
  default_tax_mode: string;
  default_tax_rate: number;
  hsn_sac_code: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

/** Frozen line item stored on a recurring invoice template (JSONB). */
export type RecurringLineItemTemplate = {
  description: string;
  notes?: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  hsn_sac_code?: string | null;
};

export type RecurringInvoiceStatus = "active" | "paused" | "cancelled";

export type RecurringInterval = "daily" | "weekly" | "monthly" | "yearly";

/**
 * Row shape for `public.recurring_invoices`
 * (see supabase/migrations/20260630120000_recurring_invoices.sql).
 */
export type RecurringInvoiceRow = {
  id: string;
  user_id: string;
  client_id: string;
  project_id: string | null;
  title: string;
  status: RecurringInvoiceStatus;
  interval: RecurringInterval;
  interval_count: number;
  start_date: string;
  next_run_at: string | null;
  last_run_at: string | null;
  end_date: string | null;
  occurrences_limit: number | null;
  auto_send: boolean;
  net_days: number;
  currency: string;
  tax_mode: "none" | "vat" | "gst" | "cgst_sgst" | "igst";
  tax_rate: number;
  discount_type: "percent" | "flat";
  discount_value: number;
  notes_footer: string | null;
  payment_terms: string | null;
  line_items: RecurringLineItemTemplate[];
  occurrences_count: number;
  source_document_id: string | null;
  created_at: string;
  updated_at: string;
};

export type RecurringInvoiceListRow = RecurringInvoiceRow & {
  client: { id: string; name: string } | null;
};

export type RecurringInvoiceRunStatus =
  | "generated"
  | "sent"
  | "failed"
  | "skipped";

/**
 * Row shape for `public.recurring_invoice_runs`
 * (see supabase/migrations/20260630120100_recurring_invoice_runs.sql).
 */
export type RecurringInvoiceRunRow = {
  id: string;
  recurring_invoice_id: string;
  user_id: string;
  document_id: string | null;
  period_start: string;
  period_end: string;
  status: RecurringInvoiceRunStatus;
  error: string | null;
  created_at: string;
};

export type RecurringInvoiceDetailRow = RecurringInvoiceListRow & {
  runs: RecurringInvoiceRunRow[];
};

/** DocumentRow extended with invoice-specific fields and embedded line items. */
export type InvoiceDocumentRow = DocumentRow & {
  invoice_number: string | null;
  due_date: string | null;
  payment_terms: string | null;
  notes_footer: string | null;
  paid_at: string | null;
  pay_token: string | null;
  line_items: LineItemRow[];
};

/** DocumentRow extended with embedded line items for quotes. */
export type QuoteDocumentRow = DocumentRow & {
  line_items: LineItemRow[];
};

/** DocumentRow extended with embedded line items for proposals. */
export type ProposalDocumentRow = DocumentRow & {
  line_items: LineItemRow[];
};

export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";

export type Subscription = {
  id: string;
  user_id: string;
  lemon_squeezy_id: string | null;
  ls_customer_id: string | null;
  ls_variant_id: string | null;
  customer_portal_url: string | null;
  plan: "free" | "starter" | "pro" | "agency";
  status: SubscriptionStatus;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Row shape for `public.document_templates` (see supabase/migrations/*_document_templates.sql).
 * `user_id` is null for system templates (is_system = true).
 */
export type DocumentTemplateRow = {
  id: string;
  user_id: string | null;
  type: DocumentType;
  name: string;
  description: string | null;
  content_json: TiptapDoc;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

/** Matches `notifications.type` check constraint. */
export type NotificationType =
  | "invoice_paid"
  | "invoice_overdue"
  | "quote_approved"
  | "quote_declined"
  | "proposal_approved"
  | "doc_sent"
  | "task_due"
  | "task_overdue"
  | "daily_digest"
  | "follow_up_pending"
  | "client_health_drop";

/**
 * Text and target for one notification row.
 *
 * `title` is the scannable line the list renders in full weight; `body` is the
 * optional supporting detail beneath it. Producers that have only one sentence
 * to say may omit `body` — they should not pad it.
 */
export type NotificationPayload = {
  href: string;
  entity_id: string;
  title: string;
  body?: string;
};

/**
 * Shape of rows written before the title/body split: one string carrying the
 * whole meaning. `normalizeNotificationPayload` folds these into
 * `NotificationPayload` (label becomes the title), so nothing downstream of the
 * query layer reads `label`. No new producer may write this shape.
 */
export type LegacyNotificationPayload = {
  href: string;
  entity_id: string;
  label: string;
};

/** Row shape for `public.notifications`. */
export type ConsentLogRow = {
  id: string;
  user_id: string;
  consent_type: "terms" | "privacy" | "cookies";
  action: "accepted" | "updated" | "revoked";
  policy_version: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: NotificationPayload;
  read_at: string | null;
  action_taken_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Matches the `public.follow_up_trigger` enum. */
export type FollowUpTriggerType =
  | "invoice_overdue"
  | "invoice_due_soon"
  | "document_unanswered"
  | "project_stale";

/** Matches the `public.follow_up_status` enum. */
export type FollowUpStatus = "pending" | "sent" | "dismissed" | "resolved";

/** Row shape for `public.follow_ups`. */
export type FollowUpRow = {
  id: string;
  user_id: string;
  trigger_type: FollowUpTriggerType;
  subject_type: "document" | "project";
  subject_id: string;
  client_id: string | null;
  rung: number;
  status: FollowUpStatus;
  /** Display-only snapshot written at detection time. */
  facts: Record<string, string | number>;
  sent_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentMethod =
  | "bank_transfer"
  | "cash"
  | "cheque"
  | "card"
  | "other";

/** Row shape for `public.payments`. */
export type PaymentRow = {
  id: string;
  document_id: string;
  user_id: string;
  amount: number;
  currency: string;
  fx_rate: number | null;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  paid_at: string;
  created_at: string;
  updated_at: string;
};

export type InvoiceAdjustmentType = "write_off";

/** Row shape for `public.invoice_adjustments`. */
export type InvoiceAdjustmentRow = {
  id: string;
  document_id: string;
  user_id: string;
  type: InvoiceAdjustmentType;
  amount: number;
  reason: string;
  created_at: string;
  updated_at: string;
};

/**
 * Row shape for `public.dashboard_dismissals` (see
 * supabase/migrations/20260913090000_dashboard_dismissals.sql). Snooze state
 * for the dashboard queue: a row exists per (user, queue item); `item_id` is
 * the document/project/task id the queue item points at.
 */
export type DashboardDismissalRow = {
  id: string;
  user_id: string;
  /** Queue-item category, e.g. "overdue_invoice". */
  item_type: string;
  /** Document/project/task uuid the queue item points at. */
  item_id: string;
  snoozed_until: string | null;
  dismissed_at: string | null;
  created_at: string;
};
