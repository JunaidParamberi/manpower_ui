import type { SupabaseClient } from "@supabase/supabase-js";

type PaymentInput = {
  paymentId: string;
  amount: number;
  currency: string;
  method: string;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  fxRate?: number | null;
};

/**
 * Called from recordInvoicePayment after the payment row is inserted.
 * Creates a receipt document linked to the source invoice.
 * Returns the new receipt document id, or null on failure.
 */
export async function createReceipt(
  supabase: SupabaseClient,
  userId: string,
  invoiceId: string,
  payment: PaymentInput,
): Promise<string | null> {
  const { data: invoice, error: invError } = await supabase
    .from("documents")
    .select("id, client_id, project_id, title")
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .single();

  if (invError || !invoice) return null;

  const { nextDocumentNumber } = await import("@/lib/documents/document-numbers");
  const receiptNumber = await nextDocumentNumber(supabase, userId, "receipt");

  const { data: receipt, error: insertError } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      client_id: invoice.client_id,
      project_id: invoice.project_id,
      type: "receipt",
      status: "sent",
      title: `Receipt – ${invoice.title}`,
      content_json: { type: "doc", content: [] },
      receipt_number: receiptNumber,
      source_document_id: invoiceId,
      payment_id: payment.paymentId,
      paid_at: payment.paidAt,
      currency: payment.currency,
      fx_rate: payment.fxRate ?? null,
    })
    .select("id")
    .single();

  if (insertError || !receipt) return null;
  return receipt.id;
}
