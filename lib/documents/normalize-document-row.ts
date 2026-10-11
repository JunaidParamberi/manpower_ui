import { computeDocumentTotals } from "@/lib/documents/compute-document-totals";
import { pickEmbed } from "@/lib/supabase/pick-embed";
import type {
  DocumentListRow,
  DocumentRow,
  DocumentStatus,
  DocumentTemplateRow,
  DocumentType,
  TiptapDoc,
} from "@/types";

type DocumentRowRaw = {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  type: string;
  status: string;
  title: string;
  title_is_auto?: boolean | null;
  content_json: unknown;
  pdf_url?: string | null;
  sent_at?: string | null;
  viewed_at?: string | null;
  signed_at?: string | null;
  invoice_number?: string | null;
  due_date?: string | null;
  payment_terms?: string | null;
  notes_footer?: string | null;
  paid_at?: string | null;
  pay_token?: string | null;
  discount_value?: number | string;
  discount_type?: string;
  quote_number?: string | null;
  proposal_number?: string | null;
  valid_until?: string | null;
  approval_token?: string | null;
  approved_at?: string | null;
  declined_at?: string | null;
  approval_message?: string | null;
  approval_recipient_email?: string | null;
  approval_otp?: string | null;
  approval_otp_expires_at?: string | null;
  approved_by_email?: string | null;
  receipt_number?: string | null;
  source_document_id?: string | null;
  payment_id?: string | null;
  lpo_number?: string | null;
  lpo_validity_date?: string | null;
  lpo_amount?: number | null;
  lpo_pdf_url?: string | null;
  lpo_reference_number?: string | null;
  proposal_content?: unknown;
  tax_mode?: string;
  tax_rate?: number | string;
  currency?: string;
  fx_rate?: number | null;
  tds_enabled?: boolean;
  tds_rate?: number | string;
  tds_certificate_url?: string | null;
  recurring_invoice_id?: string | null;
  created_at: string;
  updated_at: string;
  issued_at?: string | null;
  line_items?: Array<{ quantity: number | string; unit_price: number | string; tax_rate?: number | string | null }> | null;
};

function coerceContent(raw: unknown): TiptapDoc {
  if (raw && typeof raw === "object" && (raw as { type?: unknown }).type === "doc") {
    return raw as TiptapDoc;
  }
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function normalizeDocumentRow(
  row: DocumentRowRaw,
  fallbackCurrency: string = "USD",
): DocumentRow {
  return {
    id: row.id,
    user_id: row.user_id,
    client_id: row.client_id,
    project_id: row.project_id,
    type: row.type as DocumentType,
    status: row.status as DocumentStatus,
    title: row.title,
    title_is_auto: row.title_is_auto ?? false,
    content_json: coerceContent(row.content_json),
    pdf_url: row.pdf_url ?? null,
    sent_at: row.sent_at ?? null,
    viewed_at: row.viewed_at ?? null,
    signed_at: row.signed_at ?? null,
    invoice_number: row.invoice_number ?? null,
    due_date: row.due_date ?? null,
    payment_terms: row.payment_terms ?? null,
    notes_footer: row.notes_footer ?? null,
    paid_at: row.paid_at ?? null,
    pay_token: row.pay_token ?? null,
    // Postgres numeric columns arrive as strings ("5.00"); money maths and
    // tax labels ("VAT 5%") need numbers.
    discount_value: Number(row.discount_value ?? 0),
    discount_type: (row.discount_type ?? 'percent') as 'percent' | 'flat',
    quote_number: row.quote_number ?? null,
    proposal_number: row.proposal_number ?? null,
    valid_until: row.valid_until ?? null,
    approval_token: row.approval_token ?? null,
    approved_at: row.approved_at ?? null,
    declined_at: row.declined_at ?? null,
    approval_message: row.approval_message ?? null,
    approval_recipient_email: row.approval_recipient_email ?? null,
    approval_otp: row.approval_otp ?? null,
    approval_otp_expires_at: row.approval_otp_expires_at ?? null,
    approved_by_email: row.approved_by_email ?? null,
    receipt_number: row.receipt_number ?? null,
    source_document_id: row.source_document_id ?? null,
    payment_id: row.payment_id ?? null,
    lpo_number: row.lpo_number ?? null,
    lpo_validity_date: row.lpo_validity_date ?? null,
    lpo_amount: row.lpo_amount ?? null,
    lpo_pdf_url: row.lpo_pdf_url ?? null,
    lpo_reference_number: row.lpo_reference_number ?? null,
    proposal_content: (row.proposal_content as import("@/types").ProposalContent | null) ?? null,
    tax_mode: ((row.tax_mode ?? "none") as "none" | "vat" | "gst" | "cgst_sgst" | "igst"),
    tax_rate: Number(row.tax_rate ?? 0),
    currency: row.currency ?? fallbackCurrency,
    fx_rate: row.fx_rate ?? null,
    tds_enabled: row.tds_enabled ?? false,
    tds_rate: Number(row.tds_rate ?? 0),
    tds_certificate_url: row.tds_certificate_url ?? null,
    recurring_invoice_id: row.recurring_invoice_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    issued_at: row.issued_at ?? null,
    deleted_at: (row as { deleted_at?: string | null }).deleted_at ?? null,
    internal_notes: (row as { internal_notes?: string | null }).internal_notes ?? null,
    void_reason: (row as { void_reason?: string | null }).void_reason ?? null,
  };
}

export function normalizeDocumentListRow(
  row: DocumentRowRaw & { clients?: unknown; projects?: unknown },
  fallbackCurrency: string = "USD",
): DocumentListRow {
  const base = normalizeDocumentRow(row, fallbackCurrency);
  const clientEmbed = pickEmbed(row.clients, "name");
  const projectEmbed = pickEmbed(row.projects, "title");
  const lineItems = Array.isArray(row.line_items) ? row.line_items : null;
  // Same total the document shows: discount, then document or line-item tax.
  const total_amount = lineItems && lineItems.length > 0
    ? computeDocumentTotals(
        lineItems,
        Number(base.discount_value ?? 0),
        base.discount_type,
        { taxMode: base.tax_mode, taxRate: base.tax_rate },
      ).total
    : null;
  // Read currency directly from the raw embed object since pickEmbed only extracts one field
  const clientRawNode = row.clients != null
    ? (Array.isArray(row.clients) ? row.clients[0] : row.clients)
    : null;
  const clientCurrency =
    clientRawNode &&
    typeof clientRawNode === "object" &&
    "currency" in (clientRawNode as Record<string, unknown>)
      ? ((clientRawNode as Record<string, unknown>).currency as string | null | undefined) ?? fallbackCurrency
      : fallbackCurrency;
  const rawPayments = (row as unknown as { payments?: unknown }).payments;
  const payments = Array.isArray(rawPayments)
    ? (rawPayments as Array<{ amount: number | string | null }>)
    : null;
  return {
    ...base,
    ...(payments ? { amount_paid: payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0) } : {}),
    client: clientEmbed
      ? {
          id: clientEmbed.id,
          name: clientEmbed.name,
          currency: clientCurrency,
        }
      : null,
    project: projectEmbed
      ? { id: projectEmbed.id, title: projectEmbed.title }
      : null,
    total_amount,
  };
}

type TemplateRowRaw = {
  id: string;
  user_id: string | null;
  type: string;
  name: string;
  description: string | null;
  content_json: unknown;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

export function normalizeTemplateRow(
  row: TemplateRowRaw,
): DocumentTemplateRow {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type as DocumentType,
    name: row.name,
    description: row.description,
    content_json: coerceContent(row.content_json),
    is_system: row.is_system,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
