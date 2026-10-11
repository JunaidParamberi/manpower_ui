/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The two Postgres functions the app calls through `supabase.rpc(...)`.
 * Both are implemented in SQL in the original repo; here they operate on the
 * same JSON store the rest of the mock uses.
 */
import { insertRow, rowsOf, type RowError } from "@/lib/mock/db";
import { getDb, persist } from "@/lib/mock/store";
import type { MockRpcResult } from "@/lib/mock/types";

type Args = Record<string, any>;

function error(message: string, code?: string): MockRpcResult {
  return { data: null, error: { message, code } };
}

function toError(result: { error: RowError }): MockRpcResult {
  return { data: null, error: { message: result.error.message, code: result.error.code } };
}

/**
 * `increment_document_sequence(p_user_id, p_doc_type) → integer`
 *
 * INSERT … ON CONFLICT DO UPDATE, so a new (user, type) starts at 1 and every
 * call afterwards returns the incremented value.
 */
function incrementDocumentSequence(args: Args): MockRpcResult {
  const db = getDb();
  const userId = args.p_user_id;
  const docType = args.p_doc_type;
  if (!userId || !docType) return error("missing argument", "PGRST202");

  const rows = rowsOf(db, "document_sequences");
  const existing = rows.find(
    (row) => row.user_id === userId && row.doc_type === docType,
  );

  if (existing) {
    existing.last_value = Number(existing.last_value ?? 0) + 1;
    persist();
    return { data: existing.last_value, error: null };
  }

  const inserted = insertRow(db, "document_sequences", {
    user_id: userId,
    doc_type: docType,
    last_value: 1,
  });
  if ("error" in inserted) return toError(inserted);
  persist();
  return { data: 1, error: null };
}

/**
 * `record_invoice_payment(...) RETURNS TABLE (payment_id uuid, replayed boolean)`
 *
 * Idempotent on (provider, external_id), optionally writes off the remainder,
 * and moves the document to `p_next_status`.
 */
function recordInvoicePayment(args: Args): MockRpcResult {
  const db = getDb();
  const userId = args.p_user_id;
  const documentId = args.p_document_id;
  if (!userId || !documentId) return error("missing argument", "PGRST202");

  const payments = rowsOf(db, "payments");

  // Replay check (provider + external id)
  if (args.p_external_id != null) {
    const existing = payments.find(
      (row) =>
        row.user_id === userId &&
        row.provider === args.p_provider &&
        row.external_id === args.p_external_id,
    );
    if (existing) return { data: [{ payment_id: existing.id, replayed: true }], error: null };
  }

  const payment = insertRow(db, "payments", {
    document_id: documentId,
    user_id: userId,
    amount: Number(args.p_amount ?? 0),
    currency: args.p_currency ?? "USD",
    method: args.p_method ?? null,
    reference: args.p_reference ?? null,
    notes: args.p_notes ?? null,
    provider: args.p_provider ?? "manual",
    external_id: args.p_external_id ?? null,
    paid_at: args.p_paid_at ?? new Date().toISOString(),
    fx_rate: args.p_fx_rate ?? null,
  });
  if ("error" in payment) return toError(payment);

  const writeOff = Number(args.p_write_off_amount ?? 0);
  if (writeOff > 0) {
    const adjustment = insertRow(db, "invoice_adjustments", {
      document_id: documentId,
      user_id: userId,
      type: "write_off",
      amount: writeOff,
      reason:
        typeof args.p_write_off_reason === "string" && args.p_write_off_reason.trim()
          ? args.p_write_off_reason.trim()
          : "Remainder written off",
    });
    if ("error" in adjustment) return toError(adjustment);
  }

  const documents = rowsOf(db, "documents");
  const document = documents.find((row) => row.id === documentId && row.user_id === userId);
  if (document) {
    document.status = args.p_next_status ?? document.status;
    if (args.p_next_status === "paid") document.paid_at = args.p_paid_at;
    document.updated_at = new Date().toISOString();
  }

  persist();
  return { data: [{ payment_id: payment.row.id, replayed: false }], error: null };
}

export function runRpc(name: string, args: Args = {}): Promise<MockRpcResult> {
  switch (name) {
    case "increment_document_sequence":
      return Promise.resolve(incrementDocumentSequence(args));
    case "record_invoice_payment":
      return Promise.resolve(recordInvoicePayment(args));
    default:
      return Promise.resolve(error(`function public.${name}(...) does not exist`, "42883"));
  }
}

export class MockRpc implements PromiseLike<MockRpcResult> {
  private readonly name: string;
  private readonly args: Args;
  private pending: Promise<MockRpcResult> | null = null;

  constructor(name: string, args: Args) {
    this.name = name;
    this.args = args;
  }

  then<TResult1 = MockRpcResult, TResult2 = never>(
    onfulfilled?: ((value: MockRpcResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    this.pending ??= runRpc(this.name, this.args);
    return this.pending.then(onfulfilled, onrejected);
  }
}
