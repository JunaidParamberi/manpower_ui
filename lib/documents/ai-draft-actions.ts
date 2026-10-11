"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { createDocument } from "@/lib/documents/document-mutations";
import { applyAiDraftToLineItemRows, draftNotesFooter } from "@/lib/documents/ai-draft-line-items";
import { shouldConvertQuote } from "@/lib/documents/ai-draft-source";
import { convertQuoteToInvoice } from "@/lib/documents/quote-mutations";
import { computeDueDate } from "@/lib/documents/due-date";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { parseDocumentDraftResult } from "@/lib/ai/document-writer-result";
import { emptyTiptapDoc } from "@/lib/validations/document";

type SourceRow = {
  id: string;
  type: string;
  status: string;
  notes_footer: string | null;
  tax_mode: string | null;
  tax_rate: number | null;
  discount_value: number | null;
  discount_type: string | null;
};

export async function createDocumentFromAiDraft(
  input: unknown,
): Promise<{ ok: true; documentId: string } | { ok: false; message: string }> {
  const parsed = parseDocumentDraftResult(input);
  if (!parsed.ok) {
    return { ok: false, message: parsed.error };
  }
  const draft = parsed.data;
  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  // A draft built from an existing quote/proposal: read it back (RLS-scoped)
  // so totals, tax and discount come from the real record, not the card.
  let source: SourceRow | null = null;
  if (draft.sourceDocumentId) {
    const { data } = await supabase
      .from("documents")
      .select("id, type, status, notes_footer, tax_mode, tax_rate, discount_value, discount_type")
      .eq("id", draft.sourceDocumentId)
      .eq("user_id", user.id)
      .maybeSingle();
    source = (data as SourceRow | null) ?? null;
  }

  // An approved quote → invoice uses the app's own conversion: same number
  // sequence, due date from client terms, one invoice per quote.
  if (shouldConvertQuote(draft, source) && source) {
    const converted = await convertQuoteToInvoice(source.id);
    if (!converted.ok || !converted.invoiceId) {
      return { ok: false, message: converted.error ?? "Could not create the invoice." };
    }
    return { ok: true, documentId: converted.invoiceId };
  }

  const clientId =
    draft.clientMatchStatus === "matched" && draft.matchedClientId
      ? draft.matchedClientId
      : null;

  const created = await createDocument({
    type: draft.docType,
    title: draft.title,
    status: "draft",
    client_id: clientId ?? "",
    project_id: draft.projectId ?? "",
    content_json: emptyTiptapDoc(),
  });

  if (!created.ok) {
    return { ok: false, message: created.message ?? "Could not create draft." };
  }

  const documentId = created.document.id;

  // Everything createDocument doesn't take: the draft's currency (the one
  // the user named, or the source's), notes/terms, a due date for invoices
  // from the client's payment terms, and the source's tax and discount.
  const patch: Record<string, unknown> = {};
  if (draft.currency && draft.currency !== created.document.currency) {
    patch.currency = draft.currency;
  }
  const footer = draftNotesFooter(draft) || source?.notes_footer || null;
  if (footer) {
    patch.notes_footer = footer;
  }
  if (source) {
    patch.source_document_id = source.id;
    patch.tax_mode = source.tax_mode ?? "none";
    patch.tax_rate = source.tax_rate ?? 0;
    patch.discount_value = source.discount_value;
    patch.discount_type = source.discount_type;
  }
  if (draft.docType === "invoice" && clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("payment_terms_days")
      .eq("id", clientId)
      .eq("user_id", user.id)
      .maybeSingle();
    const dueDate = computeDueDate(new Date().toISOString(), client?.payment_terms_days);
    if (dueDate) {
      patch.due_date = dueDate;
    }
  }
  if (Object.keys(patch).length > 0) {
    const { error: patchError } = await supabase.from("documents").update(patch).eq("id", documentId);
    if (patchError) {
      return { ok: false, message: "Draft created but some details failed to save." };
    }
  }

  const rows = applyAiDraftToLineItemRows(draft);

  if (rows.length > 0) {
    const { error } = await supabase.from("line_items").insert(
      rows.map((r) => ({
        document_id: documentId,
        description: r.description,
        quantity: r.quantity,
        unit_price: r.unit_price,
        sort_order: r.sort_order,
        tax_rate: r.tax_rate,
        notes: null,
        hsn_sac_code: null,
      })),
    );
    if (error) {
      return { ok: false, message: "Draft created but line items failed to save." };
    }
  }

  revalidateTag("documents");
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidatePath("/documents");
  return { ok: true, documentId };
}
