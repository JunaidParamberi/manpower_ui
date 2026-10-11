import { z } from "zod";
import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";

const uuidSchema = z.string().uuid();

export type ReceiptData = {
  receiptNumber: string | null;
  paidAt: string;
  amount: number;
  currency: string;
  fxRate?: number | null;
  method: string;
  reference: string | null;
  notes: string | null;
  invoiceNumber: string | null;
  invoiceTitle: string;
};

type ReceiptDocRow = {
  id: string;
  receipt_number: string | null;
  payment_id: string | null;
};

const _cachedReceiptsForInvoice = unstable_cache(
  async (userId: string, invoiceId: string): Promise<ReceiptDocRow[]> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("documents")
      .select("id, receipt_number, payment_id")
      .eq("source_document_id", invoiceId)
      .eq("user_id", userId)
      .eq("type", "receipt")
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data ?? []) as ReceiptDocRow[];
  },
  ["documents-receipts-for-invoice"],
  { revalidate: 60, tags: ["documents", "finance"] },
);

export async function getReceiptsForInvoice(
  invoiceId: string,
): Promise<ReceiptDocRow[]> {
  const parsed = uuidSchema.safeParse(invoiceId);
  if (!parsed.success) return [];

  const { user } = await getServerContext();
  if (!user) return [];

  return _cachedReceiptsForInvoice(user.id, parsed.data);
}

export async function getReceiptForInvoice(
  invoiceId: string,
): Promise<ReceiptDocRow | null> {
  const receipts = await getReceiptsForInvoice(invoiceId);
  return receipts[0] ?? null;
}

const _cachedReceiptData = unstable_cache(
  async (
    userId: string,
    receiptDocumentId: string,
  ): Promise<ReceiptData | null> => {
    const supabase = createAdminClient();

    const { data: voucher, error: vErr } = await supabase
      .from("documents")
      .select("receipt_number, paid_at, source_document_id, payment_id")
      .eq("id", receiptDocumentId)
      .eq("user_id", userId)
      .eq("type", "receipt")
      .single();

    if (vErr || !voucher?.source_document_id) return null;

    const paymentQuery = supabase
      .from("payments")
      .select("amount, currency, method, reference, notes, paid_at, fx_rate")
      .eq("document_id", voucher.source_document_id)
      .eq("user_id", userId);

    const [{ data: sourceInvoice }, { data: payment }] = await Promise.all([
      supabase
        .from("documents")
        .select("invoice_number, title")
        .eq("id", voucher.source_document_id)
        .eq("user_id", userId)
        .maybeSingle(),
      (voucher.payment_id
        ? paymentQuery.eq("id", voucher.payment_id)
        : paymentQuery.order("paid_at", { ascending: false }).limit(1)
      ).maybeSingle(),
    ]);

    if (!payment) return null;

    return {
      receiptNumber: voucher.receipt_number,
      paidAt:
        (payment.paid_at as string) ??
        (voucher.paid_at as string | null) ??
        new Date().toISOString(),
      amount: Number(payment.amount),
      currency: payment.currency as string,
      fxRate: payment.fx_rate != null ? Number(payment.fx_rate) : null,
      method: payment.method as string,
      reference: payment.reference as string | null,
      notes: payment.notes as string | null,
      invoiceNumber: sourceInvoice?.invoice_number ?? null,
      invoiceTitle: sourceInvoice?.title ?? "Invoice",
    };
  },
  ["documents-receipt-data"],
  { revalidate: 60, tags: ["documents", "finance"] },
);

export async function getReceiptData(
  receiptDocumentId: string,
): Promise<ReceiptData | null> {
  const parsed = uuidSchema.safeParse(receiptDocumentId);
  if (!parsed.success) return null;

  const { user } = await getServerContext();
  if (!user) return null;

  return _cachedReceiptData(user.id, parsed.data);
}
