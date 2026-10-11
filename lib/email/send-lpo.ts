"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { formatEmailError } from "@/lib/email/email-error";
import { assertSendable } from "@/lib/email/assert-sendable";

/**
 * Frontend-only build: no email is actually dispatched. The approval token
 * is still generated and persisted (so the link stays stable), and the LPO
 * is marked sent in the database as before.
 */
export async function sendLpo(input: {
  documentId: string;
  recipientEmail: string;
  subject?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!input.recipientEmail) {
      return { ok: false, error: "Recipient email is required." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You must be logged in to send LPOs." };

    const sendable = await assertSendable(supabase, input.documentId, user.id);
    if (!sendable.ok) return { ok: false, error: sendable.error };

    const { data: lpo } = await supabase
      .from("documents")
      .select("*")
      .eq("id", input.documentId)
      .eq("user_id", user.id)
      .eq("type", "local_purchase_order")
      .maybeSingle();

    if (!lpo) return { ok: false, error: "LPO not found." };

    // Reuse existing token so previously emailed links stay alive.
    const approvalToken = (lpo.approval_token as string | null) ?? randomUUID();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const portalUrl = `${appUrl}/lpo/${approvalToken}`;

    // Persist token BEFORE "sending" — the client should never get a dead link.
    if (!lpo.approval_token) {
      const { error: tokenError } = await supabase
        .from("documents")
        .update({ approval_token: approvalToken })
        .eq("id", input.documentId)
        .eq("user_id", user.id);
      if (tokenError) return { ok: false, error: "Could not prepare the approval link. Try again." };
    }

    console.log("[mock-email] sendLpo", {
      documentId: input.documentId,
      to: input.recipientEmail,
      subject: input.subject ?? null,
      portalUrl,
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
      console.error("[sendLpo] status update failed:", updateError.message);
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
      await notifyDocumentEvent(supabase, user.id, input.documentId, "doc_sent");
    }

    revalidatePath(`/documents/${input.documentId}`);
    revalidatePath("/documents");
    revalidateTag("dashboard");
    revalidateTag("finance");
    revalidateTag("documents");

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sendLpo] unexpected error:", message);
    return { ok: false, error: formatEmailError(message) };
  }
}
