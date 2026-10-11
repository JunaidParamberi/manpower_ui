"use server";

import { refreshAutoTitle } from "@/lib/documents/refresh-auto-title";
import { revalidatePath, revalidateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { lpoMetaSchema, emptyTiptapDoc } from "@/lib/validations/document";
import { nextDocumentNumber } from "@/lib/documents/document-numbers";
import { getQuoteWithLineItems } from "@/lib/documents/quote-queries";
import { computeBillingProgress } from "@/lib/documents/lpo/billing-progress";
import { calculateInvoiceTotal } from "@/lib/documents/payment-balance";

export async function updateLPOMeta(
  documentId: string,
  rawInput: unknown,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = lpoMetaSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Invalid LPO metadata." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { data: existingDoc } = await supabase
    .from("documents")
    .select("lpo_number, status")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existingDoc) return { ok: false, error: "LPO not found." };
  if (!["draft", "sent", "viewed"].includes((existingDoc as { status: string }).status)) {
    return { ok: false, error: `Cannot edit a ${(existingDoc as { status: string }).status.replace(/_/g, " ")} LPO.` };
  }
  const shouldSendAcknowledgement =
    !((existingDoc as { lpo_number: string | null }).lpo_number) &&
    Boolean(parsed.data.lpo_number);

  if (parsed.data.lpo_number && parsed.data.lpo_number !== (existingDoc as { lpo_number: string | null }).lpo_number) {
    const { data: dup } = await supabase
      .from("documents")
      .select("id")
      .eq("lpo_number", parsed.data.lpo_number)
      .eq("type", "local_purchase_order")
      .neq("id", documentId)
      .limit(1)
      .maybeSingle();
    if (dup) return { ok: false, error: `LPO number ${parsed.data.lpo_number} is already in use.` };
  }

  const { error } = await supabase
    .from("documents")
    .update({
      lpo_number: parsed.data.lpo_number,
      lpo_validity_date: parsed.data.lpo_validity_date ?? null,
      lpo_amount: parsed.data.lpo_amount ?? null,
    })
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/documents/${documentId}`);
  revalidatePath(`/documents/${documentId}/edit`);
  revalidateTag("dashboard");
  revalidateTag("documents");

  if (shouldSendAcknowledgement) {
    const { sendLpoAcknowledgedEmail } = await import(
      "@/lib/email/send-client-transactional"
    );
    const emailResult = await sendLpoAcknowledgedEmail({
      supabase,
      userId: user.id,
      userEmail: user.email ?? null,
      documentId,
    });
    if (!emailResult.ok) {
      console.error("[updateLPOMeta] LPO acknowledgement email failed:", emailResult.error);
    }
  }

  return { ok: true };
}

export async function uploadLPOPdf(
  documentId: string,
  formData: FormData,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const file = formData.get("lpo_pdf") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "No file provided." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "File must be under 10 MB." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${user.id}/${documentId}/lpo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("lpo-documents")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { ok: false, error: uploadError.message };

  const { error: updateError } = await supabase
    .from("documents")
    .update({ lpo_pdf_url: path }) // storage path; signed URL resolved at read time
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (updateError) return { ok: false, error: updateError.message };

  revalidatePath(`/documents/${documentId}`);
  revalidatePath(`/documents/${documentId}/edit`);
  revalidateTag("documents");

  return { ok: true, url: path };
}

export async function createLpo(input: {
  clientId: string;
  projectId?: string | null;
  lpoNumber?: string | null;
  lpoAmount?: number | null;
  lpoValidityDate?: string | null;
  lpoReferenceNumber?: string | null;
  title?: string;
}): Promise<{ ok: boolean; lpoId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const lpoNumber =
    input.lpoNumber?.trim() ||
    (await nextDocumentNumber(supabase, user.id, "local_purchase_order"));

  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      type: "local_purchase_order",
      status: "draft",
      title: input.title?.trim() || `LPO ${lpoNumber}`,
      title_is_auto: !input.title?.trim(),
      client_id: input.clientId,
      project_id: input.projectId ?? null,
      content_json: emptyTiptapDoc(),
      lpo_number: lpoNumber,
      lpo_amount: input.lpoAmount ?? null,
      lpo_validity_date: input.lpoValidityDate ?? null,
      lpo_reference_number: input.lpoReferenceNumber ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Failed to create LPO." };
  await refreshAutoTitle(supabase, user.id, data.id);

  revalidatePath("/documents");
  revalidateTag("dashboard");
  revalidateTag("documents");

  return { ok: true, lpoId: data.id };
}

export async function createLpoDraftFromQuote(
  quoteId: string,
  ctx?: { supabase: SupabaseClient; userId: string },
): Promise<{ ok: boolean; lpoId?: string; alreadyCreated?: boolean; error?: string }> {
  let supabase: SupabaseClient;
  let userId: string;
  if (ctx) {
    supabase = ctx.supabase;
    userId = ctx.userId;
  } else {
    supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not authenticated." };
    userId = user.id;
  }

  // Idempotent: one LPO per quote.
  const { data: existingLpo } = await supabase
    .from("documents")
    .select("id")
    .eq("source_document_id", quoteId)
    .eq("type", "local_purchase_order")
    .eq("user_id", userId)
    .neq("status", "voided")
    .limit(1)
    .maybeSingle();
  if (existingLpo) {
    return { ok: true, lpoId: existingLpo.id, alreadyCreated: true };
  }

  const quote = await getQuoteWithLineItems(quoteId, ctx ? { supabase: ctx.supabase, userId: ctx.userId } : undefined);
  if (!quote || !quote.client_id) {
    return { ok: false, error: "Quote not found or missing client." };
  }

  const lpoNumber = await nextDocumentNumber(supabase, userId, "local_purchase_order");

  const lineItems = quote.line_items ?? [];
  const lpoAmount = calculateInvoiceTotal(
    lineItems,
    Number(quote.discount_value ?? 0),
    (quote.discount_type ?? "percent") as "percent" | "flat",
    { taxMode: quote.tax_mode, taxRate: quote.tax_rate },
  );

  const { data: newDoc, error: insertError } = await supabase
    .from("documents")
    .insert({
      user_id: userId,
      type: "local_purchase_order",
      status: "draft",
      title: `LPO — ${quote.title}`,
      title_is_auto: quote.title_is_auto ?? false,
      client_id: quote.client_id,
      project_id: quote.project_id ?? null,
      content_json: emptyTiptapDoc(),
      lpo_number: lpoNumber,
      lpo_amount: lpoAmount,
      source_document_id: quoteId,
      currency: quote.currency ?? "USD",
      discount_value: quote.discount_value ?? 0,
      discount_type: quote.discount_type ?? "percent",
      tax_mode: quote.tax_mode ?? "none",
      tax_rate: quote.tax_rate ?? 0,
    })
    .select("id")
    .single();

  if (insertError || !newDoc) {
    return { ok: false, error: insertError?.message ?? "Failed to create LPO draft." };
  }

  if (lineItems.length > 0) {
    await supabase.from("line_items").insert(
      lineItems.map((li) => ({
        document_id: newDoc.id,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        tax_rate: li.tax_rate,
        sort_order: li.sort_order,
      })),
    );
  }

  const { insertAuditEntry } = await import("@/lib/documents/lpo/audit-log");
  await insertAuditEntry(supabase, {
    documentId: newDoc.id,
    userId: userId,
    field: "created_from_quote",
    newValue: quoteId,
  });

  revalidatePath("/documents");
  revalidateTag("dashboard");
  revalidateTag("documents");

  // An automatic quote title becomes "Purchase order for …".
  await refreshAutoTitle(supabase, userId, newDoc.id);

  return { ok: true, lpoId: newDoc.id };
}

export async function createInvoiceFromLpo(lpoId: string): Promise<{
  ok: boolean;
  invoiceId?: string;
  warning?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { data: lpo } = await supabase
    .from("documents")
    .select("*, line_items(*)")
    .eq("id", lpoId)
    .eq("user_id", user.id)
    .eq("type", "local_purchase_order")
    .maybeSingle();

  if (!lpo) return { ok: false, error: "LPO not found." };

  const { data: linked } = await supabase
    .from("documents")
    .select("id, status, discount_value, discount_type, tax_mode, tax_rate, line_items(quantity, unit_price, tax_rate)")
    .eq("source_document_id", lpoId)
    .eq("type", "invoice")
    .neq("status", "archived")
    .neq("status", "voided");

  const linkedWithAmounts = (linked ?? []).map((inv) => ({
    total_amount: calculateInvoiceTotal(
      (inv.line_items ?? []) as Array<{ quantity: number; unit_price: number; tax_rate: number }>,
      Number(inv.discount_value ?? 0),
      (inv.discount_type ?? "percent") as "percent" | "flat",
      { taxMode: inv.tax_mode, taxRate: inv.tax_rate },
    ),
    status: inv.status,
  }));

  const progress = computeBillingProgress({
    lpoAmount: lpo.lpo_amount ?? null,
    invoices: linkedWithAmounts,
  });

  const lineItems: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    sort_order: number;
  }> = (lpo.line_items ?? []) as typeof lineItems;

  const newInvoiceTotal = calculateInvoiceTotal(
    lineItems,
    Number(lpo.discount_value ?? 0),
    (lpo.discount_type ?? "percent") as "percent" | "flat",
    { taxMode: lpo.tax_mode, taxRate: lpo.tax_rate },
  );

  let warning: string | undefined;
  if (
    lpo.lpo_amount != null &&
    progress.invoiced_amount + newInvoiceTotal > Number(lpo.lpo_amount)
  ) {
    const overBy = (
      progress.invoiced_amount + newInvoiceTotal - Number(lpo.lpo_amount)
    ).toFixed(2);
    warning = `This invoice will exceed the LPO ceiling by ${overBy}. Proceed with caution.`;
  }

  // Due date from client payment terms.
  let dueDate: string | null = null;
  if (lpo.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("payment_terms_days")
      .eq("id", lpo.client_id)
      .eq("user_id", user.id)
      .maybeSingle();
    const { computeDueDate } = await import("@/lib/documents/due-date");
    dueDate = computeDueDate(new Date().toISOString(), client?.payment_terms_days);
  }

  const invoiceNumber = await nextDocumentNumber(supabase, user.id, "invoice");

  const { data: newInvoice, error: insertError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      type: "invoice",
      status: "draft",
      title: lpo.title.replace(/^LPO\s*—?\s*/i, "") || lpo.title,
      title_is_auto: lpo.title_is_auto ?? false,
      client_id: lpo.client_id,
      project_id: lpo.project_id ?? null,
      content_json: emptyTiptapDoc(),
      source_document_id: lpoId,
      lpo_reference_number: lpo.lpo_reference_number ?? lpo.lpo_number,
      invoice_number: invoiceNumber,
      discount_value: lpo.discount_value ?? 0,
      discount_type: lpo.discount_type ?? "percent",
      tax_mode: lpo.tax_mode ?? "none",
      tax_rate: lpo.tax_rate ?? 0,
      currency: lpo.currency ?? null,
      due_date: dueDate,
    })
    .select("id")
    .single();

  if (insertError || !newInvoice) {
    return {
      ok: false,
      error: insertError?.message ?? "Failed to create invoice.",
    };
  }

  if (lineItems.length > 0) {
    await supabase.from("line_items").insert(
      lineItems.map((li) => ({
        document_id: newInvoice.id,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        tax_rate: li.tax_rate,
        sort_order: li.sort_order,
      })),
    );
  }

  revalidatePath("/documents");
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");

  // An automatic LPO title becomes "Invoice for …".
  await refreshAutoTitle(supabase, user.id, newInvoice.id);

  return { ok: true, invoiceId: newInvoice.id, warning };
}
