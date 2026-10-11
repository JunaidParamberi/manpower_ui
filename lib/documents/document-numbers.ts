import type { SupabaseClient } from "@supabase/supabase-js";

const PREFIX: Record<string, string> = {
  invoice:              "INV",
  quote:                "QUO",
  receipt:              "RCT",
  proposal:             "PRO",
  local_purchase_order: "LPO",
};

export function formatDocumentNumber(type: string, n: number): string {
  const prefix = PREFIX[type] ?? "DOC";
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

/**
 * Atomically increment the sequence for (userId, type) and return
 * the next formatted document number.
 *
 * Uses a Postgres function with INSERT ... ON CONFLICT ... DO UPDATE
 * which is row-level atomic — two concurrent calls get different values.
 */
export async function nextDocumentNumber(
  supabase: SupabaseClient,
  userId: string,
  type: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("increment_document_sequence", {
    p_user_id: userId,
    p_doc_type: type,
  });

  if (error || typeof data !== "number") {
    throw new Error(
      `Failed to generate document number for type "${type}": ${error?.message ?? "unexpected RPC response"}`
    );
  }

  return formatDocumentNumber(type, data);
}
