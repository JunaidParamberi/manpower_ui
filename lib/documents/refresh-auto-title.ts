import type { SupabaseClient } from "@supabase/supabase-js";

import { buildAutoTitle } from "@/lib/documents/auto-title";

type Embed<T> = T | T[] | null;

function one<T>(value: Embed<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Regenerates a document's title from its client, project and first line
 * item — only while `title_is_auto` is true. Call after any mutation that
 * changes those inputs. Best-effort: a failure never blocks the mutation.
 * `userId` adds an ownership filter; pass null where RLS already scopes the
 * client to the signed-in user.
 */
export async function refreshAutoTitle(
  supabase: SupabaseClient,
  userId: string | null,
  documentId: string,
): Promise<string | null> {
  let query = supabase
    .from("documents")
    .select(
      "title, title_is_auto, type, clients:client_id(name, company), projects:project_id(title), line_items(description, sort_order)",
    )
    .eq("id", documentId);
  if (userId) query = query.eq("user_id", userId);
  const { data } = await query.maybeSingle();
  if (!data || !data.title_is_auto) return null;

  const client = one(data.clients as Embed<{ name: string | null; company: string | null }>);
  const project = one(data.projects as Embed<{ title: string | null }>);
  const firstItem = ((data.line_items ?? []) as { description: string | null; sort_order: number | null }[])
    .filter((li) => li.description?.trim())
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.description;

  const next = buildAutoTitle({
    type: data.type,
    clientName: client?.company ?? client?.name ?? null,
    projectTitle: project?.title ?? null,
    firstItem: firstItem ?? null,
  });
  if (next === data.title) return next;

  let update = supabase
    .from("documents")
    .update({ title: next })
    .eq("id", documentId)
    .eq("title_is_auto", true); // never overwrite a title the user just set
  if (userId) update = update.eq("user_id", userId);
  const { error } = await update;
  if (error) {
    console.error("[refreshAutoTitle] update failed:", error.message);
    return null;
  }
  return next;
}
