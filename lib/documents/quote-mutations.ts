"use server";

import { refreshAutoTitle } from "@/lib/documents/refresh-auto-title";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { quoteMetaSchema } from "@/lib/validations/document";
import { getQuoteWithLineItems } from "@/lib/documents/quote-queries";
import { nextDocumentNumber } from "@/lib/documents/document-numbers";
import { emptyTiptapDoc } from "@/lib/validations/document";

export async function updateQuoteMeta(
  documentId: string,
  rawInput: unknown
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: docStatus } = await supabase
    .from("documents")
    .select("status")
    .eq("id", documentId)
    .maybeSingle();
  if (docStatus && docStatus.status !== "draft") {
    return {
      ok: false,
      error: `Cannot edit a ${docStatus.status.replace(/_/g, " ")} quote. Create a new quote for corrections.`,
    };
  }
  const parsed = quoteMetaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Invalid quote metadata" };
  }

  const { error } = await supabase
    .from("documents")
    .update({
      quote_number:   parsed.data.quote_number ?? null,
      valid_until:    parsed.data.valid_until ?? null,
      notes_footer:   parsed.data.notes_footer ?? null,
      discount_value: parsed.data.discount_value ?? 0,
      discount_type:  parsed.data.discount_type ?? 'percent',
      tax_mode:       parsed.data.tax_mode ?? 'none',
      tax_rate:       parsed.data.tax_rate ?? 0,
      ...(parsed.data.currency ? { currency: parsed.data.currency } : {}),
      fx_rate:        parsed.data.fx_rate ?? null,
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

export async function markQuoteApproved(
  documentId: string,
  message?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data: existing } = await supabase
    .from("documents")
    .select("status, type")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Document not found." };
  if (existing.status === "approved") return { ok: true }; // idempotent
  const { assertTransition } = await import("@/lib/documents/status-transitions");
  const transition = assertTransition(
    existing.type as import("@/types").DocumentType,
    existing.status as import("@/types").DocumentStatus,
    "approved",
  );
  if (!transition.ok) return { ok: false, error: transition.error };

  const { error } = await supabase
    .from("documents")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approval_message: message ?? null,
    })
    .eq("id", documentId)
    .eq("user_id", user.id)
    .eq("status", existing.status); // optimistic lock
  if (error) return { ok: false, error: error.message };

  const { notifyDocumentEvent } = await import(
    "@/lib/notifications/document-notification"
  );
  await notifyDocumentEvent(supabase, user.id, documentId, "quote_approved");

  // Auto-draft an LPO from the approved quote (non-blocking but awaited so it actually runs)
  const { createLpoDraftFromQuote } = await import(
    "@/lib/documents/lpo-mutations"
  );
  const lpoResult = await createLpoDraftFromQuote(documentId, {
    supabase,
    userId: user.id,
  });
  if (!lpoResult.ok) {
    console.error("[markQuoteApproved] LPO auto-draft failed:", lpoResult.error);
  }

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  revalidatePath("/dashboard", "layout");
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");
  return { ok: true };
}

export async function markQuoteDeclined(
  documentId: string,
  message?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data: existing } = await supabase
    .from("documents")
    .select("status, type")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Document not found." };
  if (existing.status === "declined") return { ok: true }; // idempotent
  const { assertTransition } = await import("@/lib/documents/status-transitions");
  const transition = assertTransition(
    existing.type as import("@/types").DocumentType,
    existing.status as import("@/types").DocumentStatus,
    "declined",
  );
  if (!transition.ok) return { ok: false, error: transition.error };

  const { error } = await supabase
    .from("documents")
    .update({
      status: "declined",
      declined_at: new Date().toISOString(),
      approval_message: message ?? null,
    })
    .eq("id", documentId)
    .eq("user_id", user.id)
    .eq("status", existing.status); // optimistic lock
  if (error) return { ok: false, error: error.message };

  const { notifyDocumentEvent } = await import(
    "@/lib/notifications/document-notification"
  );
  await notifyDocumentEvent(supabase, user.id, documentId, "quote_declined");

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  revalidatePath("/dashboard", "layout");
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");
  return { ok: true };
}

export async function convertQuoteToInvoice(
  quoteId: string
): Promise<{ ok: boolean; invoiceId?: string; alreadyConverted?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const quote = await getQuoteWithLineItems(quoteId);
  if (!quote) return { ok: false, error: "Quote not found" };
  if (quote.status !== "approved") {
    return { ok: false, error: "Only approved quotes can be converted to an invoice." };
  }

  // Idempotent: one invoice per quote.
  const { data: existingInvoice } = await supabase
    .from("documents")
    .select("id")
    .eq("source_document_id", quoteId)
    .eq("type", "invoice")
    .eq("user_id", user.id)
    .neq("status", "voided")
    .limit(1)
    .maybeSingle();
  if (existingInvoice) {
    return { ok: true, invoiceId: existingInvoice.id, alreadyConverted: true };
  }

  // Due date from client payment terms.
  let dueDate: string | null = null;
  if (quote.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("payment_terms_days")
      .eq("id", quote.client_id)
      .eq("user_id", user.id)
      .maybeSingle();
    const { computeDueDate } = await import("@/lib/documents/due-date");
    dueDate = computeDueDate(new Date().toISOString(), client?.payment_terms_days);
  }

  const invoiceNumber = await nextDocumentNumber(supabase, user.id, "invoice");

  const { data: newDoc, error: insertError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      type: "invoice",
      status: "draft",
      title: quote.title,
      title_is_auto: quote.title_is_auto ?? false,
      client_id: quote.client_id,
      project_id: quote.project_id,
      content_json: emptyTiptapDoc(),
      notes_footer: quote.notes_footer,
      discount_value: quote.discount_value,
      discount_type: quote.discount_type,
      tax_mode: quote.tax_mode ?? 'none',
      tax_rate: quote.tax_rate ?? 0,
      invoice_number: invoiceNumber,
      source_document_id: quoteId,
      currency: quote.currency ?? null,
      fx_rate: quote.fx_rate ?? null,
      due_date: dueDate,
    })
    .select("id")
    .single();

  if (insertError || !newDoc) {
    return { ok: false, error: insertError?.message ?? "Failed to create invoice" };
  }

  if (quote.line_items.length > 0) {
    const { error: lineItemsError } = await supabase
      .from("line_items")
      .insert(
        quote.line_items.map((li) => ({
          document_id: newDoc.id,
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
          tax_rate: li.tax_rate,
          sort_order: li.sort_order,
        }))
      );
    if (lineItemsError) {
      return { ok: false, error: lineItemsError.message };
    }
  }

  // An automatic quote title becomes "Invoice for …".
  await refreshAutoTitle(supabase, user.id, newDoc.id);

  revalidatePath("/documents");
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");
  return { ok: true, invoiceId: newDoc.id };
}
