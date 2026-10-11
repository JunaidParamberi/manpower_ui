import { EMPTY_EDIT_CONTEXT, editConfirmLines, type EditInput } from "./document-edit.ts";
import { EMPTY_RECORD_CONTEXT, type RecordContext } from "./record-label.ts";
import type { ToolInput, ToolName } from "./tool-schemas.ts";

const ENTITY_LABELS: Record<string, string> = {
  clients: "client",
  projects: "project",
  tasks: "task",
  time_entries: "time entry",
  content_posts: "post",
  content_campaigns: "campaign",
  project_milestones: "milestone",
  services: "service",
  expenses: "expense",
  documents: "document",
  payments: "payment",
};

/**
 * Column names the user never chose and would not recognise. Anything absent
 * falls back to a de-underscored, sentence-cased version of the column, which
 * is right far more often than it is wrong ("due_date" → "Due date").
 */
const FIELD_LABELS: Record<string, string> = {
  company_name: "Company",
  full_name: "Name",
  contact_name: "Contact",
  default_rate: "Rate",
  estimated_minutes: "Estimate",
  duration_seconds: "Duration",
  client_visible: "Visible to client",
  relationship_status: "Relationship",
  lead_source: "Lead source",
  payment_terms_days: "Payment terms",
  scheduled_at: "Scheduled",
  invoice_number: "Invoice number",
  internal_notes: "Notes",
  service_type: "Type",
  project_id: "Project",
  client_id: "Client",
  campaign_id: "Campaign",
  milestone_id: "Milestone",
  document_id: "Document",
  task_id: "Task",
};

function label(entity: string): string {
  return ENTITY_LABELS[entity] ?? entity.replace(/_/g, " ");
}

function fieldLabel(column: string): string {
  const known = FIELD_LABELS[column];
  if (known) {
    return known;
  }
  const words = column.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "empty";
  }
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }
  return String(value);
}

/** "client “Test Client Co.”" when the name is known, "client" when it is not. */
function named(entity: string, name: string | null): string {
  return name ? `${label(entity)} “${name}”` : label(entity);
}

function titleOf(fields: Record<string, unknown>): string | null {
  for (const key of ["name", "title", "description", "caption"]) {
    const value = fields[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

/**
 * One line describing what happened (or is about to). Shown on the card.
 *
 * `context` carries what the caller resolved about the target record. It is
 * optional so that callers with nothing to resolve — a draft, an email — do
 * not have to fabricate one; without it the summary degrades to the entity
 * alone rather than falling back to an id.
 */
export function summarizeAction(
  name: ToolName,
  input: ToolInput,
  context: RecordContext = EMPTY_RECORD_CONTEXT,
): string {
  const record = input as Record<string, unknown>;

  switch (name) {
    case "create_record": {
      const entity = String(record.entity);
      const fields = (record.fields ?? {}) as Record<string, unknown>;
      return `Created ${named(entity, titleOf(fields))}`;
    }
    case "update_record":
      // Past tense: a safe update reaches the card only after it ran. Delete,
      // send and record_payment are always risky, so they read as pending.
      return `Updated ${named(String(record.entity), context.name)}`;
    case "delete_record":
      return `Delete ${named(String(record.entity), context.name)}`;
    case "send_email":
      return `Send email to ${String(record.to)}`;
    case "record_payment":
      return `Record payment of ${String(record.amount)}`;
    case "edit_document":
      // Always risky, so this reads as pending on the confirmation card; the
      // executor writes its own past-tense summary once the edit has run.
      return `Update ${context.edit?.label ?? "document"}`;
    case "draft_document":
      return "Drafted a document";
    case "draft_email":
      return "Drafted an email";
    case "query_data":
      return `Read ${label(String(record.entity))}`;
    case "request_agent_mode":
      // Never surfaces as an action card - it changes nothing. Kept for
      // exhaustiveness so a new tool can't be added without a summary.
      return `Needs Agent mode: ${String(record.action)}`;
  }
}

/**
 * Extra lines shown on a confirmation card, so the user sees exactly what
 * will happen. Never contains an id: the point of the card is that a person
 * can recognise the record, and a UUID defeats that.
 */
export function confirmDetail(
  name: ToolName,
  input: ToolInput,
  context: RecordContext = EMPTY_RECORD_CONTEXT,
): string[] {
  const record = input as Record<string, unknown>;

  switch (name) {
    case "send_email": {
      const lines = [`To: ${String(record.to)}`, `Subject: ${String(record.subject)}`];
      if (record.documentId) {
        lines.push("Attachment: linked document");
      }
      return lines;
    }
    case "record_payment": {
      const lines = [`Amount: ${String(record.amount)}`];
      if (typeof record.method === "string" && record.method) {
        lines.push(`Method: ${record.method}`);
      }
      return lines;
    }
    case "update_record": {
      const fields = (record.fields ?? {}) as Record<string, unknown>;
      return Object.entries(fields).map(([key, value]) => {
        const next = formatValue(value);
        // Show the change, not just the destination — "Status paid" reads as
        // a fact, "Status draft → paid" reads as an edit the user can judge.
        if (Object.prototype.hasOwnProperty.call(context.before, key)) {
          const previous = formatValue(context.before[key]);
          if (previous !== next) {
            return `${fieldLabel(key)}: ${previous} → ${next}`;
          }
        }
        return `${fieldLabel(key)}: ${next}`;
      });
    }
    case "delete_record": {
      return context.detail ? [context.detail] : [];
    }
    case "edit_document":
      return editConfirmLines(input as EditInput, context.edit ?? EMPTY_EDIT_CONTEXT);
    default:
      return [];
  }
}
