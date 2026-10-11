import type { SupabaseClient } from "@supabase/supabase-js";

import { getDocumentReadiness, readinessMessage } from "@/lib/documents/readiness";

type ReadyAction = Parameters<typeof readinessMessage>[1];

/**
 * Server-side gate for outward actions. Loads the fields readiness needs and
 * refuses with a user-facing message when anything required is missing.
 */
export async function assertDocumentReady(
  supabase: SupabaseClient,
  documentId: string,
  userId: string,
  action: ReadyAction,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data } = await supabase
    .from("documents")
    .select("type, client_id, valid_until, due_date, line_items(quantity, unit_price)")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { ok: false, error: "Document not found." };

  const readiness = getDocumentReadiness(
    data,
    (data.line_items ?? []) as Array<{ quantity: number | string; unit_price: number | string }>,
  );
  const message = readinessMessage(readiness, action);
  return message ? { ok: false, error: message } : { ok: true };
}
