/**
 * Server-side allowlist deciding what the assistant's generic tools may
 * touch. The model never sees this file — it asks for an entity by name and
 * the registry decides whether that name is legal, which fields are legal,
 * and whether a write needs user confirmation.
 *
 * `user_id` and `id` are deliberately absent from every write allowlist:
 * RLS sets ownership, and letting the model write either would be a
 * tenant-boundary hole.
 */

export type EntityRisk = "safe" | "risky" | "never";

export type EntityRule = {
  read: boolean;
  write: boolean;
  risk: EntityRisk;
  readFields: readonly string[];
  writeFields: readonly string[];
  /**
   * Columns that identify a record to a human, most specific first. Used to
   * name a record on a confirmation card instead of showing its UUID. Must
   * be a subset of `readFields` — a label is a value we read back off the
   * row, so it cannot name a column the entity is not allowed to read.
   */
  labelFields: readonly string[];
  /**
   * The column carrying the owning user, or null when the table is scoped
   * indirectly (tasks and project_milestones via project_id, line_items via
   * document_id). Inserts must set this — RLS checks ownership, it does not
   * supply it.
   */
  ownerColumn: "user_id" | null;
};

const NEVER: EntityRule = {
  read: false,
  write: false,
  risk: "never",
  readFields: [],
  writeFields: [],
  labelFields: [],
  ownerColumn: null,
};

export const ENTITY_REGISTRY: Record<string, EntityRule> = {
  clients: {
    read: true,
    write: true,
    risk: "safe",
    readFields: [
      "id", "name", "email", "phone", "company", "contact_name", "website",
      "relationship_status", "lead_source", "health_score", "currency",
      "payment_terms_days", "tags", "created_at", "address", "billing_email",
      "tax_id", "preferred_contact_method", "timezone", "portal_token",
    ],
    writeFields: [
      "name", "email", "phone", "company", "contact_name", "website",
      "relationship_status", "lead_source", "notes", "payment_terms_days",
      "address", "currency", "billing_email", "tax_id",
      "preferred_contact_method", "timezone", "tags", "portal_token",
    ],
    labelFields: ["name", "company", "email"],
    ownerColumn: "user_id",
  },
  projects: {
    read: true,
    write: true,
    risk: "safe",
    readFields: [
      "id", "title", "status", "client_id", "budget", "spent",
      "start_date", "deadline", "hourly_rate", "created_at",
    ],
    writeFields: [
      "title", "status", "client_id", "budget", "start_date", "deadline",
      "hourly_rate",
    ],
    labelFields: ["title"],
    ownerColumn: "user_id",
  },
  tasks: {
    read: true,
    write: true,
    risk: "safe",
    readFields: [
      "id", "title", "description", "status", "project_id", "milestone_id",
      "due_date", "start_date", "priority", "estimated_minutes",
      "completed_at", "client_visible", "created_at", "labels",
      "parent_task_id",
    ],
    writeFields: [
      "title", "description", "status", "project_id", "milestone_id",
      "due_date", "start_date", "priority", "estimated_minutes",
      "client_visible", "labels", "parent_task_id",
    ],
    labelFields: ["title"],
    ownerColumn: null,
  },
  time_entries: {
    read: true,
    write: true,
    risk: "safe",
    readFields: [
      "id", "project_id", "task_id", "started_at", "ended_at",
      "duration_seconds", "billed", "description", "created_at",
    ],
    writeFields: [
      "project_id", "task_id", "started_at", "ended_at", "duration_seconds",
      "billed", "description",
    ],
    labelFields: ["description"],
    ownerColumn: "user_id",
  },
  content_posts: {
    read: true,
    write: true,
    risk: "safe",
    readFields: [
      "id", "title", "caption", "hashtags", "platform", "status",
      "scheduled_at", "campaign_id", "client_id", "created_at",
    ],
    writeFields: [
      "title", "caption", "hashtags", "platform", "status", "scheduled_at",
      "campaign_id", "client_id",
    ],
    labelFields: ["title", "platform"],
    ownerColumn: "user_id",
  },
  content_campaigns: {
    read: true,
    write: true,
    risk: "safe",
    readFields: ["id", "name", "goal", "client_id", "start_date", "end_date", "created_at"],
    writeFields: ["name", "goal", "client_id", "start_date", "end_date"],
    labelFields: ["name"],
    ownerColumn: "user_id",
  },
  project_milestones: {
    read: true,
    write: true,
    risk: "safe",
    readFields: [
      "id", "project_id", "title", "description", "status", "due_date",
      "client_visible", "created_at",
    ],
    writeFields: [
      "project_id", "title", "description", "status", "due_date", "client_visible",
    ],
    labelFields: ["title"],
    ownerColumn: null,
  },
  services: {
    read: true,
    write: true,
    risk: "safe",
    readFields: [
      "id", "name", "description", "default_rate", "unit", "service_type",
      "sku", "archived", "default_tax_mode", "default_tax_rate",
      "hsn_sac_code", "default_qty", "cost_price",
    ],
    writeFields: [
      "name", "description", "default_rate", "unit", "service_type", "sku",
      "archived", "default_tax_mode", "default_tax_rate", "hsn_sac_code",
      "default_qty", "cost_price",
    ],
    labelFields: ["name", "sku"],
    ownerColumn: "user_id",
  },
  expenses: {
    read: true,
    write: true,
    risk: "safe",
    readFields: [
      "id", "category", "amount", "currency", "date", "vendor", "notes",
      "project_id", "created_at",
    ],
    writeFields: ["category", "amount", "currency", "date", "vendor", "notes", "project_id"],
    labelFields: ["vendor", "category"],
    ownerColumn: "user_id",
  },

  // Money and client-facing: readable freely, writes always confirm.
  documents: {
    read: true,
    write: true,
    risk: "risky",
    readFields: [
      "id", "type", "status", "title", "client_id", "project_id", "currency",
      "invoice_number", "quote_number", "proposal_number", "receipt_number",
      "issued_at", "due_date", "sent_at", "viewed_at", "paid_at",
      "valid_until", "payment_terms", "created_at", "source_document_id",
      "notes_footer",
    ],
    writeFields: ["status", "due_date", "internal_notes", "payment_terms", "valid_until"],
    labelFields: ["title", "invoice_number"],
    ownerColumn: "user_id",
  },
  line_items: {
    read: true,
    write: false,
    risk: "risky",
    readFields: [
      "id", "document_id", "description", "quantity", "unit_price",
      "tax_rate", "sort_order",
    ],
    writeFields: [],
    labelFields: ["description"],
    ownerColumn: null,
  },
  payments: {
    read: true,
    write: true,
    risk: "risky",
    readFields: [
      "id", "document_id", "amount", "currency", "method", "reference",
      "notes", "paid_at", "created_at",
    ],
    writeFields: ["document_id", "amount", "currency", "method", "reference", "notes", "paid_at"],
    labelFields: ["reference"],
    ownerColumn: "user_id",
  },

  // Read-only reference data.
  profiles: {
    read: true,
    write: false,
    risk: "safe",
    readFields: [
      "id", "full_name", "company_name", "plan_tier", "default_currency",
      "vat_registered", "default_tax_rate",
    ],
    writeFields: [],
    // profiles is keyed by `id` (= auth.uid()), not `user_id` — it has no
    // such column. Currently unreachable since write is false, but wrong to
    // leave as "user_id" for the day someone flips that.
    labelFields: ["full_name", "company_name"],
    ownerColumn: null,
  },
  notifications: {
    read: true,
    write: false,
    risk: "safe",
    readFields: ["id", "type", "payload", "read_at", "action_taken_at", "created_at"],
    writeFields: [],
    labelFields: ["type"],
    ownerColumn: "user_id",
  },
  follow_ups: {
    read: true,
    write: false,
    risk: "safe",
    readFields: [
      "id", "trigger_type", "subject_type", "subject_id", "client_id",
      "rung", "status", "sent_at", "dismissed_at", "created_at",
    ],
    writeFields: [],
    labelFields: ["trigger_type"],
    ownerColumn: "user_id",
  },
  client_health_snapshots: {
    read: true,
    write: false,
    risk: "safe",
    readFields: ["id", "client_id", "snapshot_date", "score", "band", "created_at"],
    writeFields: [],
    labelFields: ["band"],
    ownerColumn: "user_id",
  },
  project_digests: {
    read: true,
    write: false,
    risk: "safe",
    readFields: ["id", "digest_date", "narrative", "actions", "created_at"],
    writeFields: [],
    labelFields: ["digest_date"],
    ownerColumn: "user_id",
  },
  document_templates: {
    read: true,
    write: false,
    risk: "safe",
    readFields: ["id", "name", "type", "description", "is_system"],
    writeFields: [],
    labelFields: ["name"],
    ownerColumn: "user_id",
  },
  project_templates: {
    read: true,
    write: false,
    risk: "safe",
    readFields: ["id", "name", "description", "is_system"],
    writeFields: [],
    labelFields: ["name"],
    ownerColumn: "user_id",
  },
  recurring_invoices: {
    read: true,
    write: false,
    risk: "safe",
    readFields: [
      "id", "client_id", "project_id", "title", "status", "interval",
      "interval_count", "start_date", "next_run_at", "last_run_at",
      "auto_send", "currency",
    ],
    writeFields: [],
    labelFields: ["title"],
    ownerColumn: "user_id",
  },

  // Never reachable.
  subscriptions: NEVER,
  consent_log: NEVER,
  document_audit_log: NEVER,
  document_sequences: NEVER,
  brand_kits: NEVER,
  pinned_items: NEVER,
  invoice_adjustments: NEVER,
  recurring_invoice_runs: NEVER,
  project_template_tasks: NEVER,
  project_template_milestones: NEVER,
  task_comments: NEVER,
  ai_actions: NEVER,
};

export function getEntityRule(entity: string): EntityRule | null {
  return Object.prototype.hasOwnProperty.call(ENTITY_REGISTRY, entity)
    ? ENTITY_REGISTRY[entity]
    : null;
}

export function canRead(entity: string): boolean {
  return getEntityRule(entity)?.read ?? false;
}

export function canWrite(entity: string): boolean {
  return getEntityRule(entity)?.write ?? false;
}

export function riskOf(entity: string): EntityRisk {
  return getEntityRule(entity)?.risk ?? "never";
}

export function ownerColumnFor(entity: string): "user_id" | null {
  return getEntityRule(entity)?.ownerColumn ?? null;
}

export const READABLE_ENTITIES: readonly string[] = Object.entries(ENTITY_REGISTRY)
  .filter(([, rule]) => rule.read)
  .map(([name]) => name);

/**
 * One line per writable entity, listing its exact writable column names —
 * baked into the create_record/update_record tool descriptions so the model
 * has the real field names up front instead of guessing (e.g. "address" or
 * "payment_terms" for clients, which is actually "payment_terms_days").
 * Static and small, so it costs nothing extra once the tools+system cache
 * prefix is warm.
 */
export const WRITABLE_FIELDS_REFERENCE: string = Object.entries(ENTITY_REGISTRY)
  .filter(([, rule]) => rule.write && rule.writeFields.length > 0)
  .map(([name, rule]) => `${name}: ${rule.writeFields.join(", ")}`)
  .join("\n");

export function filterReadFields(
  entity: string,
  requested?: readonly string[],
): string[] {
  const rule = getEntityRule(entity);
  if (!rule) {
    return [];
  }
  if (!requested || requested.length === 0) {
    return [...rule.readFields];
  }
  return requested.filter((field) => rule.readFields.includes(field));
}

export function filterWriteFields(
  entity: string,
  fields: Record<string, unknown>,
):
  | { ok: true; fields: Record<string, unknown> }
  | { ok: false; rejected: string[] } {
  const rule = getEntityRule(entity);
  if (!rule || !rule.write) {
    return { ok: false, rejected: Object.keys(fields) };
  }
  const rejected = Object.keys(fields).filter(
    (key) => !rule.writeFields.includes(key),
  );
  if (rejected.length > 0) {
    return { ok: false, rejected };
  }
  return { ok: true, fields };
}
