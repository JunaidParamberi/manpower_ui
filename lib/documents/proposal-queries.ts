"use server";

import { z } from "zod";
import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type { ProposalDocumentRow } from "@/types";

const uuidSchema = z.string().uuid();

const _cachedProposalWithLineItems = unstable_cache(
  async (
    userId: string,
    documentId: string,
  ): Promise<ProposalDocumentRow | null> => {
    const supabase = createAdminClient();

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", userId)
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
    } as ProposalDocumentRow;
  },
  ["documents-proposal-with-line-items"],
  { revalidate: 60, tags: ["documents"] },
);

export async function getProposalWithLineItems(
  id: string,
): Promise<ProposalDocumentRow | null> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return null;

  const { user } = await getServerContext();
  if (!user) return null;

  return _cachedProposalWithLineItems(user.id, parsed.data);
}
