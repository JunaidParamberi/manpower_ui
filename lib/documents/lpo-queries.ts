import { z } from "zod";
import { unstable_cache } from "next/cache";

import { computeBillingProgress, type LpoBillingProgress } from "@/lib/documents/lpo/billing-progress";
import { calculateInvoiceTotal } from "@/lib/documents/payment-balance";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { normalizeDocumentRow } from "@/lib/documents/normalize-document-row";
import type { DocumentRow, LineItemRow } from "@/types";

const uuidSchema = z.string().uuid();

export type LPOSummary = {
  id: string;
  lpo_number: string;
  title: string;
  lpo_amount: number | null;
  lpo_validity_date: string | null;
  status: string;
};

export type LPODocumentWithLineItems = DocumentRow & {
  line_items: LineItemRow[];
  source_quote_number: string | null;
  source_quote_title: string | null;
};

const _cachedLpoWithLineItems = unstable_cache(
  async (
    userId: string,
    lpoId: string,
  ): Promise<LPODocumentWithLineItems | null> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", lpoId)
      .eq("user_id", userId)
      .eq("type", "local_purchase_order")
      .maybeSingle();

    if (error || !data) return null;

    const document = normalizeDocumentRow(data);
    const lineItemsResult = await supabase
      .from("line_items")
      .select("*")
      .eq("document_id", document.id)
      .order("sort_order", { ascending: true });

    let sourceQuoteNumber: string | null = null;
    let sourceQuoteTitle: string | null = null;
    if (document.source_document_id) {
      const { data: sourceQuote } = await supabase
        .from("documents")
        .select("quote_number, title")
        .eq("id", document.source_document_id)
        .eq("user_id", userId)
        .eq("type", "quote")
        .maybeSingle();

      sourceQuoteNumber = sourceQuote?.quote_number ?? null;
      sourceQuoteTitle = sourceQuote?.title ?? null;
    }

    return {
      ...document,
      line_items: (lineItemsResult.data ?? []) as LineItemRow[],
      source_quote_number: sourceQuoteNumber,
      source_quote_title: sourceQuoteTitle,
    };
  },
  ["documents-lpo-with-line-items"],
  { revalidate: 60, tags: ["documents", "finance"] },
);

export async function getLpoWithLineItems(
  lpoId: string,
): Promise<LPODocumentWithLineItems | null> {
  const parsedId = uuidSchema.safeParse(lpoId);
  if (!parsedId.success) return null;

  const { user } = await getServerContext();
  if (!user) return null;

  return _cachedLpoWithLineItems(user.id, parsedId.data);
}

const _cachedActiveLPOsForClient = unstable_cache(
  async (userId: string, clientId: string): Promise<LPOSummary[]> => {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from("documents")
      .select("id, lpo_number, title, lpo_amount, lpo_validity_date, status")
      .eq("user_id", userId)
      .eq("client_id", clientId)
      .eq("type", "local_purchase_order")
      .in("status", ["draft", "sent", "viewed", "approved"])
      .not("lpo_number", "is", null)
      .order("created_at", { ascending: false });

    return (data ?? []) as LPOSummary[];
  },
  ["documents-active-lpos-for-client"],
  { revalidate: 60, tags: ["documents", "clients"] },
);

export async function getActiveLPOsForClient(
  clientId: string,
): Promise<LPOSummary[]> {
  const parsedId = uuidSchema.safeParse(clientId);
  if (!parsedId.success) return [];

  const { user } = await getServerContext();
  if (!user) return [];

  return _cachedActiveLPOsForClient(user.id, parsedId.data);
}

const _cachedLinkedInvoicesForLPO = unstable_cache(
  async (
    userId: string,
    lpoId: string,
  ): Promise<
    { id: string; title: string; invoice_number: string | null; status: string }[]
  > => {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from("documents")
      .select("id, title, invoice_number, status")
      .eq("user_id", userId)
      .eq("type", "invoice")
      .eq("source_document_id", lpoId)
      .order("created_at", { ascending: false });

    return data ?? [];
  },
  ["documents-linked-invoices-for-lpo"],
  { revalidate: 60, tags: ["documents", "finance"] },
);

export async function getLinkedInvoicesForLPO(
  lpoId: string,
): Promise<{ id: string; title: string; invoice_number: string | null; status: string }[]> {
  const parsedId = uuidSchema.safeParse(lpoId);
  if (!parsedId.success) return [];

  const { user } = await getServerContext();
  if (!user) return [];

  return _cachedLinkedInvoicesForLPO(user.id, parsedId.data);
}

const _cachedLpoBillingProgress = unstable_cache(
  async (userId: string, lpoId: string): Promise<LpoBillingProgress | null> => {
    const supabase = createAdminClient();

    const { data: lpo } = await supabase
      .from("documents")
      .select("lpo_amount")
      .eq("id", lpoId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!lpo) return null;

    const { data: linked } = await supabase
      .from("documents")
      .select("id, status, discount_value, discount_type, tax_mode, tax_rate, line_items(quantity, unit_price, tax_rate)")
      .eq("source_document_id", lpoId)
      .eq("user_id", userId)
      .eq("type", "invoice")
      .neq("status", "archived")
      .neq("status", "voided");

    const invoices = (linked ?? []).map((inv) => ({
      total_amount: calculateInvoiceTotal(
        (inv.line_items ?? []) as Array<{ quantity: number; unit_price: number; tax_rate: number }>,
        Number(inv.discount_value ?? 0),
        (inv.discount_type ?? "percent") as "percent" | "flat",
        { taxMode: inv.tax_mode, taxRate: inv.tax_rate },
      ),
      status: inv.status,
    }));

    return computeBillingProgress({
      lpoAmount: lpo.lpo_amount ? Number(lpo.lpo_amount) : null,
      invoices,
    });
  },
  ["documents-lpo-billing-progress"],
  { revalidate: 60, tags: ["documents", "finance"] },
);

export async function getLpoBillingProgress(
  lpoId: string,
): Promise<LpoBillingProgress | null> {
  const parsedId = uuidSchema.safeParse(lpoId);
  if (!parsedId.success) return null;

  const { user } = await getServerContext();
  if (!user) return null;

  return _cachedLpoBillingProgress(user.id, parsedId.data);
}
