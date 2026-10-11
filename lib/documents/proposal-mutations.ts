"use server";

import { refreshAutoTitle } from "@/lib/documents/refresh-auto-title";
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { proposalMetaSchema, emptyTiptapDoc } from "@/lib/validations/document";
import { getProposalWithLineItems } from "@/lib/documents/proposal-queries";
import { nextDocumentNumber } from "@/lib/documents/document-numbers";

export async function autoGenerateProposalNumber(
  documentId: string,
): Promise<{ number: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("documents")
    .select("proposal_number")
    .eq("id", documentId)
    .maybeSingle();

  if (data?.proposal_number) return { number: data.proposal_number as string };

  const number = await nextDocumentNumber(supabase, user.id, "proposal");
  await supabase
    .from("documents")
    .update({ proposal_number: number })
    .eq("id", documentId);

  revalidatePath(`/documents/${documentId}`);
  revalidatePath(`/documents/${documentId}/edit`);
  revalidateTag("dashboard");
  revalidateTag("documents");
  return { number };
}

export async function updateProposalMeta(
  documentId: string,
  rawInput: unknown
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const parsed = proposalMetaSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Invalid proposal metadata" };
  }

  const { error } = await supabase
    .from("documents")
    .update({
      proposal_number: parsed.data.proposal_number ?? null,
      valid_until: parsed.data.valid_until ?? null,
      notes_footer: parsed.data.notes_footer ?? null,
      discount_value: parsed.data.discount_value ?? 0,
      discount_type: parsed.data.discount_type ?? "percent",
      proposal_content: parsed.data.proposal_content ?? null,
    })
    .eq("id", documentId);

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/documents/${documentId}`);
  revalidatePath(`/documents/${documentId}/edit`);
  revalidateTag("dashboard");
  revalidateTag("documents");
  return { ok: true };
}

export async function markProposalApproved(
  documentId: string,
  message?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { error } = await supabase
    .from("documents")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approval_message: message ?? null,
    })
    .eq("id", documentId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };

  const { notifyDocumentEvent } = await import(
    "@/lib/notifications/document-notification"
  );
  await notifyDocumentEvent(supabase, user.id, documentId, "proposal_approved");

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  revalidatePath("/dashboard", "layout");
  revalidateTag("dashboard");
  revalidateTag("documents");
  return { ok: true };
}

export async function markProposalDeclined(
  documentId: string,
  message?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({
      status: "declined",
      declined_at: new Date().toISOString(),
      approval_message: message ?? null,
    })
    .eq("id", documentId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  revalidateTag("dashboard");
  revalidateTag("documents");
  return { ok: true };
}

export async function convertProposalToInvoice(
  proposalId: string
): Promise<{ ok: boolean; invoiceId?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const proposal = await getProposalWithLineItems(proposalId);
  if (!proposal) return { ok: false, error: "Proposal not found" };

  const { assertDocumentReady } = await import("@/lib/documents/assert-ready");
  const ready = await assertDocumentReady(supabase, proposalId, user.id, "convert it");
  if (!ready.ok) return { ok: false, error: ready.error };

  const invoiceNumber = await nextDocumentNumber(supabase, user.id, "invoice");

  const { data: newDoc, error: insertError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      type: "invoice",
      status: "draft",
      title: proposal.title,
      title_is_auto: proposal.title_is_auto ?? false,
      client_id: proposal.client_id,
      project_id: proposal.project_id,
      content_json: emptyTiptapDoc(),
      notes_footer: proposal.notes_footer,
      discount_value: proposal.discount_value,
      discount_type: proposal.discount_type,
      invoice_number: invoiceNumber,
    })
    .select("id")
    .single();

  if (insertError || !newDoc) {
    return { ok: false, error: insertError?.message ?? "Failed to create invoice" };
  }

  if (proposal.line_items.length > 0) {
    const { error: lineItemsError } = await supabase
      .from("line_items")
      .insert(
        proposal.line_items.map((li) => ({
          document_id: newDoc.id,
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
          tax_rate: li.tax_rate,
          sort_order: li.sort_order,
        }))
      );
    if (lineItemsError) return { ok: false, error: lineItemsError.message };
  }

  // An automatic proposal title becomes "Invoice for …".
  await refreshAutoTitle(supabase, user.id, newDoc.id);

  revalidatePath("/documents");
  revalidateTag("dashboard");
  revalidateTag("documents");
  return { ok: true, invoiceId: newDoc.id };
}
