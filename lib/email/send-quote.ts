"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatEmailError } from "@/lib/email/email-error";
import { approvalLink } from "@/lib/documents/approval-link";
import { getQuoteWithLineItems } from "@/lib/documents/quote-queries";
import { assertSendable } from "@/lib/email/assert-sendable";

interface SendQuoteInput {
  documentId: string;
  recipientEmail: string;
  subject?: string;
}

/**
 * Frontend-only build: no email is actually dispatched. The approval token
 * is still generated and persisted (so the link stays stable), and the
 * quote is marked sent in the database as before.
 */
export async function sendQuote(
  input: SendQuoteInput
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!input.recipientEmail) {
      return { ok: false, error: "Recipient email is required." };
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You must be logged in to send quotes." };

    const sendable = await assertSendable(supabase, input.documentId, user.id);
    if (!sendable.ok) return { ok: false, error: sendable.error };

    const quote = await getQuoteWithLineItems(input.documentId);
    if (!quote) return { ok: false, error: "Quote not found." };

    let approvalToken = quote.approval_token;
    const approvalRecipientEmail = input.recipientEmail.trim();
    if (!approvalToken) {
      const bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      approvalToken = Buffer.from(bytes).toString("hex");

      const { error: tokenError } = await supabase
        .from("documents")
        .update({
          approval_token: approvalToken,
          approval_recipient_email: approvalRecipientEmail,
        })
        .eq("id", input.documentId);

      if (tokenError) {
        console.error("[sendQuote] approval token update failed:", tokenError.message);
        return { ok: false, error: "Failed to generate approval link. Please try again." };
      }
    } else {
      const { error: recipientError } = await supabase
        .from("documents")
        .update({
          approval_recipient_email: approvalRecipientEmail,
        })
        .eq("id", input.documentId);

      if (recipientError) {
        console.error("[sendQuote] recipient update failed:", recipientError.message);
        return { ok: false, error: "Failed to save approval recipient. Please try again." };
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const approvalUrl = approvalLink(approvalToken, appUrl, "quote");

    console.log("[mock-email] sendQuote", {
      documentId: input.documentId,
      to: input.recipientEmail,
      subject: input.subject ?? null,
      approvalUrl,
    });

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("documents")
      .update({
        status: "sent",
        sent_at: now,
      })
      .eq("id", input.documentId);

    if (updateError) {
      console.error("[sendQuote] status update failed:", updateError.message);
    } else {
      // Set issued_at only on the first send — never overwrite on resend
      await supabase
        .from("documents")
        .update({ issued_at: now })
        .eq("id", input.documentId)
        .is("issued_at", null);
      const { notifyDocumentEvent } = await import(
        "@/lib/notifications/document-notification"
      );
      await notifyDocumentEvent(
        supabase,
        user.id,
        input.documentId,
        "doc_sent"
      );
    }

    revalidatePath(`/documents/${input.documentId}`);
    revalidatePath("/documents");
    revalidateTag("dashboard");
    revalidateTag("finance");
    revalidateTag("documents");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sendQuote] unexpected error:", message);
    return { ok: false, error: formatEmailError(message) };
  }
}
