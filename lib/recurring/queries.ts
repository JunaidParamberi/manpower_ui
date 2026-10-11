import { unstable_cache } from "next/cache";
import { z } from "zod";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  RecurringInvoiceDetailRow,
  RecurringInvoiceListRow,
} from "@/types";

const _cachedListRecurringInvoices = unstable_cache(
  async (userId: string): Promise<RecurringInvoiceListRow[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("recurring_invoices")
      .select("*, client:clients(id, name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as RecurringInvoiceListRow[];
  },
  ["list-recurring-invoices"],
  { revalidate: 60, tags: ["recurring"] },
);

export async function listRecurringInvoices(): Promise<RecurringInvoiceListRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListRecurringInvoices(user.id);
}

const _cachedGetRecurringInvoice = unstable_cache(
  async (
    userId: string,
    id: string,
  ): Promise<RecurringInvoiceDetailRow | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("recurring_invoices")
      .select("*, client:clients(id, name)")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

    const { data: runs } = await supabase
      .from("recurring_invoice_runs")
      .select("*")
      .eq("recurring_invoice_id", id)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return {
      ...(data as RecurringInvoiceListRow),
      runs: runs ?? [],
    };
  },
  ["get-recurring-invoice"],
  { revalidate: 60, tags: ["recurring"] },
);

export async function getRecurringInvoice(
  id: string,
): Promise<RecurringInvoiceDetailRow | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  return _cachedGetRecurringInvoice(user.id, id);
}

const _cachedGetRecurringBySourceDocument = unstable_cache(
  async (
    userId: string,
    documentId: string,
  ): Promise<RecurringInvoiceListRow | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("recurring_invoices")
      .select("*, client:clients(id, name)")
      .eq("user_id", userId)
      .eq("source_document_id", documentId)
      .maybeSingle();

    if (error || !data) return null;
    return data as RecurringInvoiceListRow;
  },
  ["get-recurring-by-source-document"],
  { revalidate: 60, tags: ["recurring"] },
);

export async function getRecurringBySourceDocument(
  documentId: string,
): Promise<RecurringInvoiceListRow | null> {
  const parsed = z.string().uuid().safeParse(documentId);
  if (!parsed.success) return null;

  const { user } = await getServerContext();
  if (!user) return null;
  return _cachedGetRecurringBySourceDocument(user.id, parsed.data);
}

const _cachedListRecurringSourceDocumentIds = unstable_cache(
  async (userId: string): Promise<string[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("recurring_invoices")
      .select("source_document_id")
      .eq("user_id", userId)
      .in("status", ["active", "paused"])
      .not("source_document_id", "is", null);

    if (error || !data) return [];
    return data
      .map((row) => row.source_document_id as string)
      .filter(Boolean);
  },
  ["list-recurring-source-document-ids"],
  { revalidate: 60, tags: ["recurring"] },
);

export async function listRecurringSourceDocumentIds(): Promise<string[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListRecurringSourceDocumentIds(user.id);
}
