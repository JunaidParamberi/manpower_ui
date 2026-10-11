"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseLineItemInputSafe } from "@/lib/validations/line-item";
import { invoiceMetaSchema } from "@/lib/validations/document";
import { markPaidInputSchema } from "@/lib/validations/payment";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LineItemRow } from "@/types";
import { refreshAutoTitle } from "@/lib/documents/refresh-auto-title";

const EDITABLE_STATUSES = new Set(["draft"]);

async function assertDocumentEditable(
  supabase: SupabaseClient,
  documentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data } = await supabase
    .from("documents")
    .select("status")
    .eq("id", documentId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Document not found." };
  if (!EDITABLE_STATUSES.has(data.status)) {
    return {
      ok: false,
      error: `Cannot edit a ${data.status.replace(/_/g, " ")} document. Create a new document for corrections.`,
    };
  }
  return { ok: true };
}
// Upsert a line item (insert if no id, update if id provided)
export async function upsertLineItem(
  documentId: string,
  rawInput: unknown
): Promise<{ ok: boolean; lineItem?: LineItemRow; error?: string }> {
  const supabase = await createClient();
  const guard = await assertDocumentEditable(supabase, documentId);
  if (!guard.ok) return { ok: false, error: guard.error };
  const parsed = parseLineItemInputSafe(rawInput);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const input = parsed.data;

  if (input.id) {
    const { data, error } = await supabase
      .from("line_items")
      .update({
        description: input.description,
        notes: input.notes ?? null,
        quantity: input.quantity,
        unit_price: input.unit_price,
        tax_rate: input.tax_rate,
        sort_order: input.sort_order,
        hsn_sac_code: input.hsn_sac_code ?? null,
      })
      .eq("id", input.id)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };
    // The first line item can name the document.
    await refreshAutoTitle(supabase, null, documentId);
    revalidatePath(`/documents/${documentId}`);
    revalidateTag("dashboard");
    revalidateTag("finance");
    revalidateTag("documents");
    return { ok: true, lineItem: data as LineItemRow };
  }

  const { data, error } = await supabase
    .from("line_items")
    .insert({
      document_id: documentId,
      description: input.description,
      notes: input.notes ?? null,
      quantity: input.quantity,
      unit_price: input.unit_price,
      tax_rate: input.tax_rate,
      sort_order: input.sort_order,
      hsn_sac_code: input.hsn_sac_code ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  // The first line item can name the document.
  await refreshAutoTitle(supabase, null, documentId);
  revalidatePath(`/documents/${documentId}`);
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");
  return { ok: true, lineItem: data as LineItemRow };
}

// Delete a line item by id
export async function deleteLineItem(
  id: string,
  documentId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const guard = await assertDocumentEditable(supabase, documentId);
  if (!guard.ok) return { ok: false, error: guard.error };
  const { error } = await supabase.from("line_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  // The first line item can name the document.
  await refreshAutoTitle(supabase, null, documentId);
  revalidatePath(`/documents/${documentId}`);
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");
  return { ok: true };
}

// Bulk update sort_order for reordering
export async function reorderLineItems(
  documentId: string,
  orderedIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const guard = await assertDocumentEditable(supabase, documentId);
  if (!guard.ok) return { ok: false, error: guard.error };
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("line_items")
      .update({ sort_order: index })
      .eq("id", id)
  );
  await Promise.all(updates);
  // The first line item can name the document.
  await refreshAutoTitle(supabase, null, documentId);
  revalidatePath(`/documents/${documentId}`);
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");
  return { ok: true };
}

// Update invoice-specific metadata fields
export async function updateInvoiceMeta(
  documentId: string,
  rawInput: unknown
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const guard = await assertDocumentEditable(supabase, documentId);
  if (!guard.ok) return { ok: false, error: guard.error };
  const parsed = invoiceMetaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Invalid invoice metadata" };
  }

  if (parsed.data.invoice_number) {
    const { data: dup } = await supabase
      .from("documents")
      .select("id")
      .eq("invoice_number", parsed.data.invoice_number)
      .eq("type", "invoice")
      .neq("id", documentId)
      .limit(1)
      .maybeSingle();
    if (dup) return { ok: false, error: `Invoice number ${parsed.data.invoice_number} is already in use.` };
  }

  const { error } = await supabase
    .from("documents")
    .update({
      invoice_number: parsed.data.invoice_number ?? null,
      due_date: parsed.data.due_date ?? null,
      payment_terms: parsed.data.payment_terms ?? null,
      notes_footer: parsed.data.notes_footer ?? null,
      discount_value: parsed.data.discount_value ?? 0,
      discount_type: parsed.data.discount_type ?? 'percent',
      lpo_reference_number: parsed.data.lpo_reference_number ?? null,
      tax_mode: parsed.data.tax_mode ?? 'none',
      tax_rate: parsed.data.tax_rate ?? 0,
      ...(parsed.data.currency ? { currency: parsed.data.currency } : {}),
      fx_rate: parsed.data.fx_rate ?? null,
      tds_enabled: parsed.data.tds_enabled ?? false,
      tds_rate: parsed.data.tds_rate ?? 0,
    })
    .eq("id", documentId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/documents/${documentId}`);
  revalidatePath(`/documents/${documentId}/edit`);
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");
  return { ok: true };
}

// Record an invoice payment, supporting full, partial, and write-off closure.
export async function recordInvoicePayment(
  documentId: string,
  rawInput: unknown
): Promise<{ ok: boolean; error?: string; status?: string; warning?: string }> {
  const parsed = markPaidInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid payment details" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { processPaymentEvent } = await import("@/lib/payments/process-payment-event");
  const result = await processPaymentEvent(supabase, user.id, user.email ?? null, {
    documentId,
    amount: parsed.data.amount,
    method: parsed.data.method,
    reference: parsed.data.reference ?? null,
    notes: parsed.data.notes ?? null,
    fxRate: parsed.data.fxRate ?? null,
    remainingAction: parsed.data.remainingAction,
    writeOffReason: parsed.data.writeOffReason ?? null,
    provider: "manual",
    externalId: null,
  });

  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  revalidatePath("/dashboard", "layout");
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");
  return { ok: true, status: result.status, warning: result.warning };
}

export const markInvoicePaid = recordInvoicePayment;
