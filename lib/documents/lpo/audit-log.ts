import type { SupabaseClient } from "@supabase/supabase-js";

export async function insertAuditEntry(
  supabase: SupabaseClient,
  {
    documentId,
    userId,
    field,
    oldValue,
    newValue,
  }: {
    documentId: string;
    userId: string;
    field: string;
    oldValue?: string | null;
    newValue?: string | null;
  },
): Promise<void> {
  await supabase.from("document_audit_log").insert({
    document_id: documentId,
    user_id: userId,
    field,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });
}
