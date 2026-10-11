import type { SupabaseClient } from "@supabase/supabase-js";

type EmailSendResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
};

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function numberForDocument(doc: DocumentEmailRow): string {
  if (doc.type === "invoice") return doc.invoice_number ?? "Invoice";
  if (doc.type === "quote") return doc.quote_number ?? "Quote";
  if (doc.type === "proposal") return doc.proposal_number ?? "Proposal";
  if (doc.type === "receipt") return doc.receipt_number ?? "Receipt";
  if (doc.type === "local_purchase_order") return doc.lpo_number ?? "LPO";
  return doc.title;
}

type DocumentEmailRow = {
  id: string;
  type: string;
  title: string;
  user_id: string;
  client_id: string | null;
  invoice_number: string | null;
  quote_number: string | null;
  proposal_number: string | null;
  receipt_number: string | null;
  lpo_number: string | null;
  lpo_validity_date: string | null;
  lpo_amount: number | string | null;
  due_date: string | null;
  pay_token: string | null;
  discount_value: number | string | null;
  discount_type: "percent" | "flat" | null;
  tax_mode: string | null;
  tax_rate: number | string | null;
};

type PaymentEmailRow = {
  id: string;
  amount: number | string;
  currency: string;
  method: string;
  reference: string | null;
  paid_at: string;
};

async function getDocument(
  supabase: SupabaseClient,
  documentId: string,
  userId: string
): Promise<DocumentEmailRow | null> {
  const { data } = await supabase
    .from("documents")
    .select(
      "id, type, title, user_id, client_id, invoice_number, quote_number, proposal_number, receipt_number, lpo_number, lpo_validity_date, lpo_amount, due_date, pay_token, discount_value, discount_type, tax_mode, tax_rate"
    )
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();

  return data as DocumentEmailRow | null;
}

async function getPayment(
  supabase: SupabaseClient,
  paymentId: string,
  userId: string
): Promise<PaymentEmailRow | null> {
  const { data } = await supabase
    .from("payments")
    .select("id, amount, currency, method, reference, paid_at")
    .eq("id", paymentId)
    .eq("user_id", userId)
    .maybeSingle();

  return data as PaymentEmailRow | null;
}

/** The client's saved billing/email address, used to decide whether to skip. */
async function getClientRecipientEmail(
  supabase: SupabaseClient,
  clientId: string | null,
  userId: string
): Promise<string | null> {
  if (!clientId) return null;

  const { data } = await supabase
    .from("clients")
    .select("email, billing_email")
    .eq("id", clientId)
    .eq("user_id", userId)
    .maybeSingle();
  const row = data as { email: string | null; billing_email: string | null } | null;
  return row?.billing_email ?? row?.email ?? null;
}

async function getPortalUrl(
  supabase: SupabaseClient,
  clientId: string | null,
  userId: string
): Promise<string> {
  if (!clientId) return appUrl();

  const { data } = await supabase
    .from("clients")
    .select("portal_token")
    .eq("id", clientId)
    .eq("user_id", userId)
    .maybeSingle();
  const row = data as { portal_token: string | null } | null;
  return row?.portal_token ? `${appUrl()}/portal/${row.portal_token}` : appUrl();
}

/**
 * Frontend-only build: no email is actually dispatched. The data lookups
 * (and the "skip when the client has no email address" behavior) are kept,
 * so callers still log or warn exactly when they used to.
 */
export async function sendPaymentReceiptEmail({
  supabase,
  userId,
  documentId,
  paymentId,
}: {
  supabase: SupabaseClient;
  userId: string;
  userEmail: string | null;
  documentId: string;
  paymentId: string;
}): Promise<EmailSendResult> {
  const [doc, payment] = await Promise.all([
    getDocument(supabase, documentId, userId),
    getPayment(supabase, paymentId, userId),
  ]);
  if (!doc || !payment) return { ok: false, error: "Receipt email data not found." };

  const recipientEmail = await getClientRecipientEmail(supabase, doc.client_id, userId);
  if (!recipientEmail) return { ok: true, skipped: true };

  const receiptUrl = doc.pay_token
    ? `${appUrl()}/pay/${doc.pay_token}`
    : await getPortalUrl(supabase, doc.client_id, userId);

  console.log("[mock-email] sendPaymentReceiptEmail", {
    to: recipientEmail,
    documentNumber: numberForDocument(doc),
    amount: Number(payment.amount),
    currency: payment.currency,
    receiptUrl,
  });

  return { ok: true };
}

export async function sendLpoAcknowledgedEmail({
  supabase,
  userId,
  documentId,
}: {
  supabase: SupabaseClient;
  userId: string;
  userEmail: string | null;
  documentId: string;
}): Promise<EmailSendResult> {
  const doc = await getDocument(supabase, documentId, userId);
  if (!doc || doc.type !== "local_purchase_order") {
    return { ok: false, error: "LPO not found." };
  }

  const recipientEmail = await getClientRecipientEmail(supabase, doc.client_id, userId);
  if (!recipientEmail) return { ok: true, skipped: true };

  const portalUrl = await getPortalUrl(supabase, doc.client_id, userId);

  console.log("[mock-email] sendLpoAcknowledgedEmail", {
    to: recipientEmail,
    lpoNumber: numberForDocument(doc),
    amount: doc.lpo_amount === null ? null : Number(doc.lpo_amount),
    portalUrl,
  });

  return { ok: true };
}
