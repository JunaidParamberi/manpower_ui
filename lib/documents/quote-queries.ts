"use server";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type { QuoteDocumentRow } from "@/types";

const uuidSchema = z.string().uuid();

const _cachedQuoteWithLineItems = unstable_cache(
  async (
    userId: string,
    documentId: string,
  ): Promise<QuoteDocumentRow | null> => {
    const supabase = createAdminClient();

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", userId)
      .in("type", ["quote", "proposal"])
      .single();

    if (docError || !doc) return null;

    const { data: lineItems } = await supabase
      .from("line_items")
      .select("*")
      .eq("document_id", documentId)
      .order("sort_order", { ascending: true });

    return {
      ...doc,
      line_items: lineItems ?? [],
    } as QuoteDocumentRow;
  },
  ["documents-quote-with-line-items"],
  { revalidate: 60, tags: ["documents"] },
);

export async function getQuoteWithLineItems(
  id: string,
  ctx?: { supabase: SupabaseClient; userId: string },
): Promise<QuoteDocumentRow | null> {
  if (ctx) {
    const { data: doc, error: docError } = await ctx.supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", ctx.userId)
      .in("type", ["quote", "proposal"])
      .single();

    if (docError || !doc) return null;

    const { data: lineItems } = await ctx.supabase
      .from("line_items")
      .select("*")
      .eq("document_id", id)
      .order("sort_order", { ascending: true });

    return {
      ...doc,
      line_items: lineItems ?? [],
    } as QuoteDocumentRow;
  }

  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return null;

  const { user } = await getServerContext();
  if (!user) return null;

  return _cachedQuoteWithLineItems(user.id, parsed.data);
}
