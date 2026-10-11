import type { ClientRow, LineItemRow, ProjectListRow, ServiceRow } from "@/types";
import type { VariableContext } from "@/lib/documents/variables";

/** Realistic Manpower data shared by the editor stories. */
export const client = (id: string, name: string, contact: string, currency: string): ClientRow => ({
  id, user_id: "u", name, contact_name: contact, website: null, email: `${contact.split(" ")[0].toLowerCase()}@${name.split(" ")[0].toLowerCase()}.studio`,
  billing_email: null, phone: null, company: name, address: "Business Bay, Dubai", currency, tax_id: null, payment_terms_days: 30,
  relationship_status: "active", lead_source: null, preferred_contact_method: null, timezone: null, tags: [], notes: null,
  health_score: null, portal_token: null, created_at: "", updated_at: "",
});
export const CLIENTS = [client("c1", "Acme Studio", "Sara Haddad", "AED"), client("c2", "Northwind Labs", "Tom Ellis", "GBP")];
export const PROJECTS = [{ id: "p1", client_id: "c1", title: "Brand refresh", client: { id: "c1", name: "Acme Studio" } }] as unknown as ProjectListRow[];
const svc = (id: string, name: string, rate: number, unit: ServiceRow["unit"]): ServiceRow => ({
  id, user_id: "u", name, description: null, service_type: "service", unit, sku: null, default_qty: 1, cost_price: null,
  default_rate: rate, default_tax_mode: "none", default_tax_rate: 0, hsn_sac_code: null, archived: false, created_at: "", updated_at: "",
});
export const SERVICES = [svc("s1", "Brand identity design", 6500, "project"), svc("s2", "UI design", 350, "hr"), svc("s3", "Monthly retainer", 8000, "month")];
const row = (id: string, description: string, notes: string, quantity: number, unit_price: number, sort_order: number): LineItemRow => ({
  id, document_id: "d1", description, notes, quantity, unit_price, tax_rate: 0, sort_order, hsn_sac_code: null, created_at: "", updated_at: "",
});
export const LINES = [row("l1", "Brand identity design", "Logo, colour system, type pairing", 1, 6500, 0), row("l2", "UI design", "Marketing site, 6 screens", 18, 350, 1)];
export const CTX: VariableContext = {
  client: null,
  project: null,
  brand: { business_name: "Junaid Studio", primary_color: "#3550E0", email_signature: null, logo_url: null },
  sender: { name: "Junaid P", company_name: "Junaid Studio", email: "hello@junaid.studio", address_line1: "Dubai", address_line2: null, city: "Dubai", region: null, postal_code: null, country: "AE", vat_number: "100234567800003", gstin: null, vat_reg_no: null },
  now: new Date("2026-10-09"),
};


