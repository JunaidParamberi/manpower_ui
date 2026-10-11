import type { SupabaseClient } from "@supabase/supabase-js";

import { assertDocumentReady } from "@/lib/documents/assert-ready";

const SENDABLE_STATUSES = new Set(["draft", "sent", "viewed"]);

export async function assertSendable(
  supabase: SupabaseClient,
  documentId: string,
  userId: string,
): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  const { data } = await supabase
    .from("documents")
    .select("status")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Document not found." };
  if (!SENDABLE_STATUSES.has(data.status)) {
    return {
      ok: false,
      error: `This document is ${data.status.replace(/_/g, " ")} and can no longer be sent. Download the PDF to share a copy.`,
    };
  }
  const ready = await assertDocumentReady(supabase, documentId, userId, "send");
  if (!ready.ok) return ready;
  return { ok: true, status: data.status };
}
