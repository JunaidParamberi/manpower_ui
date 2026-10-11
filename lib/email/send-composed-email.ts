"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { assertSendable } from "@/lib/email/assert-sendable";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { parseComposedEmail } from "@/lib/validations/composed-email";

/**
 * Frontend-only build: no email is actually dispatched. Ownership of the
 * linked record is still checked server-side, and sending a draft's PDF
 * still marks the document sent in the database as before.
 */
export async function sendComposedEmail(
  input: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = parseComposedEmail(input);
  if (!parsed.ok) {
    return { ok: false, message: parsed.error };
  }
  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { to, subject, body, documentId, attachPdf } = parsed.data;

  // The email can be about a record (document, client, project). Ownership
  // is checked here, never trusted from the browser. A document link can
  // attach the document's PDF.
  let documentStatus: string | null = null;
  if (documentId) {
    const { data: doc } = await supabase
      .from("documents")
      .select("id, client_id, status")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!doc) {
      return { ok: false, message: "Document not found." };
    }
    documentStatus = doc.status as string;
  }

  // Sending a draft's PDF is sending the document: run the same readiness
  // check the normal send does, and mark it sent afterwards.
  const marksSent = Boolean(documentId && attachPdf && documentStatus === "draft");
  if (documentId && marksSent) {
    const sendable = await assertSendable(supabase, documentId, user.id);
    if (!sendable.ok) {
      return { ok: false, message: sendable.error };
    }
  }

  // No PDF is generated in the frontend-only build.
  console.log("[mock-email] sendComposedEmail", {
    to,
    subject,
    bodyLength: body.length,
    documentId: documentId ?? null,
    attachPdf: Boolean(documentId && attachPdf),
  });

  if (documentId && marksSent) {
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("documents")
      .update({ status: "sent", sent_at: now })
      .eq("id", documentId)
      .eq("user_id", user.id);
    if (updateError) {
      console.error("[sendComposedEmail] status update failed:", updateError.message);
    } else {
      await supabase
        .from("documents")
        .update({ issued_at: now })
        .eq("id", documentId)
        .is("issued_at", null);
      const { notifyDocumentEvent } = await import("@/lib/notifications/document-notification");
      await notifyDocumentEvent(supabase, user.id, documentId, "doc_sent");
    }
    revalidatePath(`/documents/${documentId}`);
    revalidatePath("/documents");
    revalidateTag("dashboard");
    revalidateTag("finance");
    revalidateTag("documents");
  }

  return { ok: true };
}
