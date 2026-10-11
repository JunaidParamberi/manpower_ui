"use server";

import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type {
  InvoiceAdjustmentRow,
  InvoiceDocumentRow,
  PaymentRow,
} from "@/types";

const uuidSchema = z.string().uuid();

const _cachedInvoiceWithLineItems = unstable_cache(
  async (
    userId: string,
    documentId: string,
  ): Promise<InvoiceDocumentRow | null> => {
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
    } as InvoiceDocumentRow;
  },
  ["documents-invoice-with-line-items"],
  { revalidate: 60, tags: ["documents"] },
);

/**
 * `ctx` lets a caller without a request context supply its own Supabase
 * client and the user id to scope by — the cron-driven auto-send has no
 * cookies, so the cached, session-derived path can't run there. This branch
 * enforces the tenant scope itself rather than trusting the caller's client
 * to already be scoped.
 */
export async function getInvoiceWithLineItems(
  id: string,
  ctx?: { supabase: SupabaseClient; userId: string },
): Promise<InvoiceDocumentRow | null> {
  if (ctx) {
    const { data: doc, error: docError } = await ctx.supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", ctx.userId)
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
    } as InvoiceDocumentRow;
  }

  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return null;

  const { user } = await getServerContext();
  if (!user) return null;

  return _cachedInvoiceWithLineItems(user.id, parsed.data);
}

const _cachedPaymentsForDocument = unstable_cache(
  async (userId: string, documentId: string): Promise<PaymentRow[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", userId)
      .order("paid_at", { ascending: false });
    return (data ?? []) as PaymentRow[];
  },
  ["documents-payments-for-document"],
  { revalidate: 60, tags: ["documents", "finance"] },
);

export async function getPaymentsForDocument(
  documentId: string,
): Promise<PaymentRow[]> {
  const parsed = uuidSchema.safeParse(documentId);
  if (!parsed.success) return [];

  const { user } = await getServerContext();
  if (!user) return [];

  return _cachedPaymentsForDocument(user.id, parsed.data);
}

const _cachedInvoiceAdjustmentsForDocument = unstable_cache(
  async (
    userId: string,
    documentId: string,
  ): Promise<InvoiceAdjustmentRow[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("invoice_adjustments")
      .select("*")
      .eq("document_id", documentId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []) as InvoiceAdjustmentRow[];
  },
  ["documents-invoice-adjustments-for-document"],
  { revalidate: 60, tags: ["documents", "finance"] },
);

export async function getInvoiceAdjustmentsForDocument(
  documentId: string,
): Promise<InvoiceAdjustmentRow[]> {
  const parsed = uuidSchema.safeParse(documentId);
  if (!parsed.success) return [];

  const { user } = await getServerContext();
  if (!user) return [];

  return _cachedInvoiceAdjustmentsForDocument(user.id, parsed.data);
}
