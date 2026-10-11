"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { buildAutoTitle, isLegacyPlaceholderTitle, resolveTitleSubmission } from "@/lib/documents/auto-title";
import { refreshAutoTitle } from "@/lib/documents/refresh-auto-title";
import { z } from "zod";

import {
  normalizeDocumentRow,
  normalizeTemplateRow,
} from "@/lib/documents/normalize-document-row";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import {
  DOCUMENT_LIMITS,
  emptyTiptapDoc,
  tiptapDocSchema,
  parseDocumentPropertiesInput,
  parseDocumentInput,
  parseTemplateInput,
} from "@/lib/validations/document";
import { draftDefaults, isUntouchedDraft } from "@/lib/documents/draft-defaults";
import { getServerContext } from "@/lib/supabase/get-server-context";
import {
  isManualInvoiceStatus,
  type ManualInvoiceStatus,
} from "@/lib/documents/display";
import { removePinnedItemForDeletedTarget } from "@/lib/pinned/cleanup";
import type { DocumentRow, DocumentStatus, DocumentTemplateRow, DocumentType } from "@/types";

const uuidSchema = z.string().uuid();

type FieldErrors = Record<string, string[] | undefined>;

export type CreateDocumentResult =
  | { ok: true; document: DocumentRow }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

export async function createDocument(
  input: unknown,
  opts: { today?: string } = {},
): Promise<CreateDocumentResult> {
  const parsed = parseDocumentInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors,
    };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  // Create-time defaults: client from project, currency, due date from the
  // client's terms, quote validity, profile tax. Pure rules in draft-defaults.ts.
  const [{ data: projectRow }, { data: profileRow }] = await Promise.all([
    parsed.data.project_id
      ? supabase.from("projects").select("client_id").eq("id", parsed.data.project_id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("profiles").select("default_currency, default_tax_mode, default_tax_rate").eq("id", user.id).maybeSingle(),
  ]);
  const effectiveClientId = parsed.data.client_id ?? projectRow?.client_id ?? null;
  const { data: clientRow } = effectiveClientId
    ? await supabase.from("clients").select("currency, payment_terms_days").eq("id", effectiveClientId).eq("user_id", user.id).maybeSingle()
    : { data: null };
  const defaults = draftDefaults({
    type: parsed.data.type,
    // The browser's day when it sent one: the server clock is UTC, a day off for UAE mornings.
    today: opts.today && /^\d{4}-\d{2}-\d{2}$/.test(opts.today) ? opts.today : new Date().toISOString().slice(0, 10),
    clientId: parsed.data.client_id,
    projectId: parsed.data.project_id,
    client: clientRow ?? null,
    project: projectRow ?? null,
    profile: profileRow ?? null,
  });

  // Assign document number BEFORE insert to avoid numberless-orphan on failure.
  const NUMBER_FIELD: Record<string, string> = {
    invoice:               "invoice_number",
    quote:                 "quote_number",
    proposal:              "proposal_number",
    local_purchase_order:  "lpo_number",
  };
  let numberField: Record<string, string> = {};
  if (NUMBER_FIELD[parsed.data.type]) {
    const { nextDocumentNumber } = await import("@/lib/documents/document-numbers");
    const docNumber = await nextDocumentNumber(supabase, user.id, parsed.data.type);
    numberField = { [NUMBER_FIELD[parsed.data.type]]: docNumber };
  }

  // Blank or old "Untitled …" titles mean: name it automatically.
  const titleIsAuto = !parsed.data.title || isLegacyPlaceholderTitle(parsed.data.title);

  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      title: titleIsAuto
        ? buildAutoTitle({ type: parsed.data.type, clientName: null, projectTitle: null, firstItem: null })
        : parsed.data.title,
      title_is_auto: titleIsAuto,
      type: parsed.data.type,
      status: "draft", // documents are always born draft; status moves via workflow
      client_id: defaults.client_id,
      project_id: defaults.project_id,
      content_json: parsed.data.content_json,
      currency: defaults.currency,
      due_date: defaults.due_date,
      payment_terms: defaults.payment_terms,
      valid_until: defaults.valid_until,
      tax_mode: defaults.tax_mode,
      tax_rate: defaults.tax_rate,
      ...numberField,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data) {
    return { ok: false, message: "Document could not be created." };
  }
  if (titleIsAuto) {
    const autoTitle = await refreshAutoTitle(supabase, user.id, data.id);
    if (autoTitle) data.title = autoTitle;
  }

  revalidatePath("/documents");
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");

  return { ok: true, document: normalizeDocumentRow(data) };
}

export async function createDraftDocument(input: {
  type: DocumentType;
  clientId?: string | null;
  projectId?: string | null;
  templateId?: string | null;
  /** The user's own `YYYY-MM-DD`, from the browser. */
  today?: string;
}): Promise<CreateDocumentResult> {
  let content_json = emptyTiptapDoc();
  if (input.templateId && uuidSchema.safeParse(input.templateId).success) {
    const { supabase, user } = await getServerContext();
    if (!user) return { ok: false, message: "Not authenticated." };
    // Your own templates and the shared starters, the same scope the template list uses.
    const { data: template } = await supabase
      .from("document_templates")
      .select("content_json")
      .eq("id", input.templateId)
      .or(`user_id.eq.${user.id},is_system.eq.true`)
      .maybeSingle();
    if (template?.content_json) content_json = template.content_json;
  }
  return createDocument({
    title: "",
    type: input.type,
    status: "draft",
    client_id: input.clientId ?? "",
    project_id: input.projectId ?? "",
    content_json,
  }, { today: input.today });
}

/** Deletes a brand-new draft nobody has written to. Re-checks the rule on the server. */
export async function discardUntouchedDraft(
  id: string,
): Promise<{ ok: true; discarded: boolean } | { ok: false; message: string }> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, message: "Invalid document." };
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, message: "Not authenticated." };

  const { data: doc } = await supabase
    .from("documents")
    .select("status, created_at, updated_at, line_items(count)")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!doc) return { ok: true, discarded: false };

  const lineItemCount = Array.isArray(doc.line_items) ? Number(doc.line_items[0]?.count ?? 0) : 0;
  const untouched = isUntouchedDraft({
    status: doc.status,
    lineItemCount,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    now: new Date().toISOString(),
  });
  if (!untouched) return { ok: true, discarded: false };

  const result = await deleteDocument(parsedId.data);
  if (!result.ok) return { ok: false, message: result.message };
  return { ok: true, discarded: true };
}

export type UpdateDocumentResult =
  | { ok: true; document: DocumentRow }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

export async function updateDocument(
  id: string,
  input: unknown,
): Promise<UpdateDocumentResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid document." };
  }

  const parsed = parseDocumentInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors,
    };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: existing } = await supabase
    .from("documents")
    .select("status, title, title_is_auto")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return { ok: false, message: "Document not found." };
  if (["paid", "partially_paid", "written_off", "voided"].includes(existing.status)) {
    return {
      ok: false,
      message: `Cannot edit a ${existing.status.replace(/_/g, " ")} document. Create a new document for corrections.`,
    };
  }

  const { data, error } = await supabase
    .from("documents")
    .update({
      ...titleUpdate(parsed.data.title, existing),
      client_id: parsed.data.client_id,
      project_id: parsed.data.project_id,
      content_json: parsed.data.content_json,
    })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data) {
    return { ok: false, message: "Document not found or could not be updated." };
  }
  // Client / project may have changed the automatic title.
  const autoTitle = await refreshAutoTitle(supabase, user.id, parsedId.data);
  if (autoTitle) data.title = autoTitle;

  revalidatePath("/documents");
  revalidatePath(`/documents/${parsedId.data}`);
  revalidatePath(`/documents/${parsedId.data}/edit`);
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");

  return { ok: true, document: normalizeDocumentRow(data) };
}

export async function updateDocumentProperties(
  id: string,
  input: unknown,
): Promise<UpdateDocumentResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid document." };
  }

  const parsed = parseDocumentPropertiesInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors,
    };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: existingProps } = await supabase
    .from("documents")
    .select("status, title, title_is_auto")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existingProps) return { ok: false, message: "Document not found." };
  if (["paid", "partially_paid", "written_off", "voided"].includes(existingProps.status)) {
    return {
      ok: false,
      message: `Cannot edit a ${existingProps.status.replace(/_/g, " ")} document. Create a new document for corrections.`,
    };
  }

  const updatePayload: Record<string, unknown> = {
    ...titleUpdate(parsed.data.title, existingProps),
    type: parsed.data.type,
    client_id: parsed.data.client_id,
    project_id: parsed.data.project_id,
  };
  if (parsed.data.content_json !== undefined) {
    updatePayload.content_json = parsed.data.content_json;
  }

  const { data, error } = await supabase
    .from("documents")
    .update(updatePayload)
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data) {
    return { ok: false, message: "Document not found or could not be updated." };
  }
  // Client / project may have changed the automatic title.
  const autoTitle = await refreshAutoTitle(supabase, user.id, parsedId.data);
  if (autoTitle) data.title = autoTitle;

  revalidatePath("/documents");
  revalidatePath(`/documents/${parsedId.data}`);
  revalidatePath(`/documents/${parsedId.data}/edit`);
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");

  return { ok: true, document: normalizeDocumentRow(data) };
}

const LOCKED_STATUSES = ["paid", "partially_paid", "written_off", "voided"];

/** The signed-in user's own document, unless it is locked for edits. */
async function loadOwnEditable(id: string) {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return { ok: false as const, message: "Invalid document." };
  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false as const, message: "Not authenticated." };
  const { data: existing } = await supabase
    .from("documents")
    .select("status, title, title_is_auto")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!existing) return { ok: false as const, message: "Document not found." };
  if (LOCKED_STATUSES.includes(existing.status)) {
    return {
      ok: false as const,
      message: `Cannot edit a ${existing.status.replace(/_/g, " ")} document. Create a new document for corrections.`,
    };
  }
  return { ok: true as const, supabase, user, id: parsedId.data, existing };
}

function revalidateDocument(id: string) {
  revalidatePath("/documents");
  revalidatePath(`/documents/${id}`);
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");
}

/**
 * Changes only the client and project. The title is left alone, so a document named
 * automatically keeps following its client, project and first line.
 */
export async function updateDocumentLinks(
  id: string,
  links: { client_id: string | null; project_id: string | null },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const doc = await loadOwnEditable(id);
  if (!doc.ok) return doc;
  const clientId = links.client_id && uuidSchema.safeParse(links.client_id).success ? links.client_id : null;
  const projectId = links.project_id && uuidSchema.safeParse(links.project_id).success ? links.project_id : null;
  const { error } = await doc.supabase
    .from("documents")
    .update({ client_id: clientId, project_id: projectId })
    .eq("id", doc.id)
    .eq("user_id", doc.user.id);
  if (error) return { ok: false, message: error.message };
  await refreshAutoTitle(doc.supabase, doc.user.id, doc.id);
  revalidateDocument(doc.id);
  return { ok: true };
}

/** Sets the document's own name. A blank name goes back to the automatic one. */
export async function renameDocument(
  id: string,
  title: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const doc = await loadOwnEditable(id);
  if (!doc.ok) return doc;
  const trimmed = title.trim().slice(0, DOCUMENT_LIMITS.title);
  const { error } = await doc.supabase
    .from("documents")
    .update(titleUpdate(trimmed, doc.existing))
    .eq("id", doc.id)
    .eq("user_id", doc.user.id);
  if (error) return { ok: false, message: error.message };
  await refreshAutoTitle(doc.supabase, doc.user.id, doc.id);
  revalidateDocument(doc.id);
  return { ok: true };
}

/** Saves only the rich-text body, never the title or links. */
export async function updateDocumentContent(
  id: string,
  contentJson: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const doc = await loadOwnEditable(id);
  if (!doc.ok) return doc;
  const parsed = tiptapDocSchema.safeParse(contentJson);
  if (!parsed.success) return { ok: false, message: "That content can't be saved." };
  const { error } = await doc.supabase
    .from("documents")
    .update({ content_json: parsed.data })
    .eq("id", doc.id)
    .eq("user_id", doc.user.id);
  if (error) return { ok: false, message: error.message };
  revalidateDocument(doc.id);
  return { ok: true };
}

export type UpdateInvoiceManualStatusResult =
  | { ok: true; status: ManualInvoiceStatus }
  | { ok: false; message: string };

export async function updateInvoiceManualStatus(
  id: string,
  nextStatus: string,
): Promise<UpdateInvoiceManualStatusResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid document." };
  }

  if (!isManualInvoiceStatus(nextStatus)) {
    return { ok: false, message: "Invalid invoice status." };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: current } = await supabase
    .from("documents")
    .select("status, type")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .eq("type", "invoice")
    .maybeSingle();
  if (!current) return { ok: false, message: "Invoice not found." };

  const { assertTransition } = await import("@/lib/documents/status-transitions");
  const transition = assertTransition("invoice", current.status as import("@/types").DocumentStatus, nextStatus as import("@/types").DocumentStatus);
  if (!transition.ok) return { ok: false, message: transition.error };

  // Leaving draft for a live status (sent, paid, …) needs a complete invoice.
  if (current.status === "draft" && !["draft", "voided", "archived"].includes(nextStatus)) {
    const { assertDocumentReady } = await import("@/lib/documents/assert-ready");
    const ready = await assertDocumentReady(supabase, parsedId.data, user.id, "mark it as sent");
    if (!ready.ok) return { ok: false, message: ready.error };
  }

  const { data, error } = await supabase
    .from("documents")
    .update({ status: nextStatus })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .eq("status", current.status) // optimistic lock against concurrent change
    .select("id, status")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data) {
    return {
      ok: false,
      message: "Invoice status changed concurrently. Refresh and try again.",
    };
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${parsedId.data}`);
  revalidatePath(`/documents/${parsedId.data}/edit`);
  revalidatePath("/dashboard", "layout");
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");

  return { ok: true, status: data.status as ManualInvoiceStatus };
}

export type DeleteDocumentResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteDocument(
  id: string,
): Promise<DeleteDocumentResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid document." };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  // Fetch document status before deleting
  const { data: doc } = await supabase
    .from("documents")
    .select("status, type")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!doc) {
    return { ok: false, message: "Document not found." };
  }

  if (doc.status !== "draft") {
    return {
      ok: false,
      message: "Only draft documents can be deleted. Void it instead to keep your records intact.",
    };
  }

  const { error, count } = await supabase
    .from("documents")
    .delete({ count: "exact" })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }
  if (count === 0) {
    return { ok: false, message: "Document not found." };
  }

  await removePinnedItemForDeletedTarget({
    supabase,
    userId: user.id,
    itemType: "document",
    itemId: parsedId.data,
  });

  revalidatePath("/documents");
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");

  return { ok: true };
}

export type VoidDocumentResult =
  | { ok: true }
  | { ok: false; message: string };

export async function voidDocument(
  id: string,
  reason: string,
): Promise<VoidDocumentResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid document." };
  }

  const trimmedReason = reason.trim();
  if (trimmedReason.length < 5) {
    return { ok: false, message: "Reason must be at least 5 characters." };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: doc } = await supabase
    .from("documents")
    .select("status, type")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!doc) {
    return { ok: false, message: "Document not found." };
  }

  const { assertTransition } = await import("@/lib/documents/status-transitions");
  const transition = assertTransition(
    doc.type as import("@/types").DocumentType,
    doc.status as import("@/types").DocumentStatus,
    "voided",
  );
  if (!transition.ok) return { ok: false, message: transition.error };

  const { error } = await supabase
    .from("documents")
    .update({
      status: "voided",
      void_reason: trimmedReason,
    })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${parsedId.data}`);
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");

  return { ok: true };
}

export type SaveAsTemplateResult =
  | { ok: true; template: DocumentTemplateRow }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

export async function saveAsTemplate(
  input: unknown,
): Promise<SaveAsTemplateResult> {
  const parsed = parseTemplateInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors,
    };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data, error } = await supabase
    .from("document_templates")
    .insert({
      user_id: user.id,
      type: parsed.data.type,
      name: parsed.data.name,
      description: parsed.data.description,
      content_json: parsed.data.content_json,
      is_system: false,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }
  if (!data) {
    return { ok: false, message: "Template could not be saved." };
  }

  revalidatePath("/documents/new");

  return { ok: true, template: normalizeTemplateRow(data) };
}

export type DeleteTemplateResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteTemplate(
  id: string,
): Promise<DeleteTemplateResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid template." };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { error, count } = await supabase
    .from("document_templates")
    .delete({ count: "exact" })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .eq("is_system", false);

  if (error) {
    return { ok: false, message: error.message };
  }
  if (count === 0) {
    return { ok: false, message: "Template not found." };
  }

  revalidatePath("/documents/new");

  return { ok: true };
}

/**
 * Title columns for an update: blank → back to automatic (the title itself is
 * regenerated right after by refreshAutoTitle); unchanged → keep the mode;
 * anything else → the user's own title.
 */
function titleUpdate(
  submitted: string,
  existing: { title: string; title_is_auto: boolean | null },
): { title_is_auto: boolean; title?: string } {
  const next = resolveTitleSubmission({
    submitted,
    current: existing.title,
    currentIsAuto: existing.title_is_auto ?? false,
  });
  return next.titleIsAuto ? { title_is_auto: true } : { title_is_auto: false, title: next.title };
}
