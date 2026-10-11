import type { ClientCreateFormInput } from "@/lib/validations/client";
import type { ClientRow } from "@/types";

/** Map a persisted row to react-hook-form defaults for the client form. */
export function clientRowToFormValues(row: ClientRow): ClientCreateFormInput {
  return {
    name: row.name,
    contact_name: row.contact_name ?? "",
    website: row.website ?? "",
    email: row.email ?? "",
    billing_email: row.billing_email ?? "",
    phone: row.phone ?? "",
    company: row.company ?? "",
    address: row.address ?? "",
    currency: row.currency ?? "",
    tax_id: row.tax_id ?? "",
    payment_terms_days:
      row.payment_terms_days === null ? "" : String(row.payment_terms_days),
    relationship_status: row.relationship_status,
    lead_source: row.lead_source ?? "",
    preferred_contact_method: row.preferred_contact_method ?? "",
    timezone: row.timezone ?? "",
    tags: row.tags.join(", "),
    notes: row.notes ?? "",
  };
}
