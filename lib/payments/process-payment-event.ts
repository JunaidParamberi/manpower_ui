import type { SupabaseClient } from "@supabase/supabase-js";

import { calculateInvoiceTotal } from "@/lib/documents/payment-balance";
import { createReceipt } from "@/lib/documents/receipt-mutations";
import {
  planPaymentApplication,
  type PaymentProvider,
} from "@/lib/payments/payment-event";
import type { DocumentStatus, DocumentType } from "@/types";

export type PaymentEventInput = {
  documentId: string;
  /** Omit for "pay in full" (mock/Stripe checkout pays the full balance). */
  amount?: number;
  method: string;
  reference?: string | null;
  notes?: string | null;
  fxRate?: number | null;
  remainingAction?: "keep_due" | "write_off";
  writeOffReason?: string | null;
  provider: PaymentProvider;
  /** Idempotency key — Stripe event id, mock pay token, etc. Null for manual entry. */
  externalId?: string | null;
};

export type PaymentEventResult =
  | { ok: true; paymentId: string; status: DocumentStatus; replayed: boolean; warning?: string }
  | { ok: false; error: string };

/**
 * Single entry point for ALL payments: manual Mark Paid, the mock pay
 * portal, and (later) Stripe webhooks. Idempotent via (provider, externalId).
 */
export async function processPaymentEvent(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null,
  input: PaymentEventInput,
): Promise<PaymentEventResult> {
  const { data: doc } = await supabase
    .from("documents")
    .select("id, type, status, currency, discount_value, discount_type, tax_mode, tax_rate")
    .eq("id", input.documentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!doc) return { ok: false, error: "Document not found." };

  const { data: lineItems } = await supabase
    .from("line_items")
    .select("quantity, unit_price, tax_rate")
    .eq("document_id", input.documentId);

  const invoiceTotal = calculateInvoiceTotal(
    lineItems ?? [],
    Number(doc.discount_value ?? 0),
    (doc.discount_type ?? "percent") as "percent" | "flat",
    { taxMode: doc.tax_mode, taxRate: doc.tax_rate },
  );

  const [{ data: existingPayments }, { data: existingWriteOffs }] = await Promise.all([
    supabase.from("payments").select("amount").eq("document_id", input.documentId).eq("user_id", userId),
    supabase
      .from("invoice_adjustments")
      .select("amount")
      .eq("document_id", input.documentId)
      .eq("user_id", userId)
      .eq("type", "write_off"),
  ]);

  const paid = (existingPayments ?? []).map((p) => Number(p.amount));
  const writtenOff = (existingWriteOffs ?? []).map((a) => Number(a.amount));
  const balanceDue = invoiceTotal - paid.reduce((s, n) => s + n, 0) - writtenOff.reduce((s, n) => s + n, 0);

  const plan = planPaymentApplication({
    documentType: doc.type as DocumentType,
    documentStatus: doc.status as DocumentStatus,
    invoiceTotal,
    existingPayments: paid,
    existingWriteOffs: writtenOff,
    amount: input.amount ?? Math.round(balanceDue * 100) / 100,
    remainingAction: input.remainingAction,
  });
  if (!plan.ok) return { ok: false, error: plan.error };

  const currency = doc.currency ?? "USD"; // document snapshot, NOT live client currency
  const paidAt = new Date().toISOString();

  const { data: rpcRows, error: rpcError } = await supabase.rpc("record_invoice_payment", {
    p_user_id: userId,
    p_document_id: input.documentId,
    p_amount: plan.amount,
    p_currency: currency,
    p_method: input.method,
    p_reference: input.reference ?? null,
    p_notes: input.notes ?? null,
    p_provider: input.provider,
    p_external_id: input.externalId ?? null,
    p_write_off_amount: plan.writeOffAmount,
    p_write_off_reason: input.writeOffReason ?? null,
    p_next_status: plan.nextStatus,
    p_paid_at: paidAt,
    p_fx_rate: input.fxRate ?? null,
  });
  if (rpcError) return { ok: false, error: rpcError.message };

  const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
  if (!row?.payment_id) return { ok: false, error: "Payment could not be recorded." };
  if (row.replayed) {
    return { ok: true, paymentId: row.payment_id, status: doc.status as DocumentStatus, replayed: true };
  }

  let warning: string | undefined;

  const receiptId = await createReceipt(supabase, userId, input.documentId, {
    paymentId: row.payment_id,
    amount: plan.amount,
    currency,
    method: input.method,
    reference: input.reference ?? null,
    notes: input.notes ?? null,
    paidAt,
    fxRate: input.fxRate ?? null,
  });
  if (!receiptId) {
    warning = "Payment recorded, but the receipt document could not be generated.";
  }

  const { sendPaymentReceiptEmail } = await import("@/lib/email/send-client-transactional");
  const emailResult = await sendPaymentReceiptEmail({
    supabase,
    userId,
    userEmail,
    documentId: input.documentId,
    paymentId: row.payment_id,
  });
  if (!emailResult.ok) {
    console.error("[processPaymentEvent] payment email failed:", emailResult.error);
    warning = warning ?? "Payment recorded, but the receipt email could not be sent.";
  }

  if (plan.nextStatus === "paid") {
    const { notifyDocumentEvent } = await import("@/lib/notifications/document-notification");
    await notifyDocumentEvent(supabase, userId, input.documentId, "invoice_paid");
  }

  return { ok: true, paymentId: row.payment_id, status: plan.nextStatus, replayed: false, warning };
}
