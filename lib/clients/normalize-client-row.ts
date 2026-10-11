import type {
  ClientPreferredContactMethod,
  ClientRelationshipStatus,
  ClientRow,
} from "@/types";

type ClientRowRaw = {
  id: string;
  user_id: string;
  name: string;
  contact_name?: string | null;
  website?: string | null;
  email: string | null;
  billing_email?: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  currency: string | null;
  tax_id?: string | null;
  payment_terms_days?: number | null;
  relationship_status?: string | null;
  lead_source?: string | null;
  preferred_contact_method?: string | null;
  timezone?: string | null;
  tags?: string[] | null;
  notes: string | null;
  health_score: number | null;
  portal_token?: string | null;
  created_at: string;
  updated_at: string;
};

const RELATIONSHIP_STATUSES = new Set<ClientRelationshipStatus>([
  "lead",
  "active",
  "paused",
  "past",
  "archived",
]);

const CONTACT_METHODS = new Set<ClientPreferredContactMethod>([
  "email",
  "phone",
  "whatsapp",
  "none",
]);

function normalizeRelationshipStatus(
  value: string | null | undefined,
): ClientRelationshipStatus {
  return RELATIONSHIP_STATUSES.has(value as ClientRelationshipStatus)
    ? (value as ClientRelationshipStatus)
    : "active";
}

function normalizeContactMethod(
  value: string | null | undefined,
): ClientPreferredContactMethod | null {
  return CONTACT_METHODS.has(value as ClientPreferredContactMethod)
    ? (value as ClientPreferredContactMethod)
    : null;
}

export function normalizeClientRow(row: ClientRowRaw): ClientRow {
  return {
    ...row,
    contact_name: row.contact_name ?? null,
    website: row.website ?? null,
    billing_email: row.billing_email ?? null,
    currency: row.currency?.trim().toUpperCase() ?? null,
    tax_id: row.tax_id ?? null,
    payment_terms_days: row.payment_terms_days ?? null,
    relationship_status: normalizeRelationshipStatus(row.relationship_status),
    lead_source: row.lead_source ?? null,
    preferred_contact_method: normalizeContactMethod(row.preferred_contact_method),
    timezone: row.timezone ?? null,
    tags: row.tags ?? [],
    portal_token: row.portal_token ?? null,
  };
}
