"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertSendable } from "@/lib/email/assert-sendable";

interface SendInvoiceInput {
  documentId: string;
  recipientEmail: string;
  subject?: string;
}

/**
 * Frontend-only build: no email is actually dispatched. The document is
 * still marked sent in the database so the app state behaves as before.
 */
export async function sendInvoice(
  input: SendInvoiceInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be logged in to send invoices." };

  const sendable = await assertSendable(supabase, input.documentId, user.id);
  if (!sendable.ok) return { ok: false, error: sendable.error };

  console.log("[mock-email] sendInvoice", {
    documentId: input.documentId,
    to: input.recipientEmail,
    subject: input.subject ?? null,
  });

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("documents")
    .update({ status: "sent", sent_at: now })
    .eq("id", input.documentId);

  if (updateError) {
    console.error("[sendInvoice] status update failed:", updateError.message);
  } else {
    // Set issued_at only on the first send — never overwrite on resend
    await supabase
      .from("documents")
      .update({ issued_at: now })
      .eq("id", input.documentId)
      .is("issued_at", null);
  }

  const { notifyDocumentEvent } = await import(
    "@/lib/notifications/document-notification"
  );
  await notifyDocumentEvent(supabase, user.id, input.documentId, "doc_sent");

  revalidatePath(`/documents/${input.documentId}`);
  revalidatePath("/documents");
  revalidateTag("dashboard");
  revalidateTag("finance");
  revalidateTag("documents");
  return { ok: true };
}
