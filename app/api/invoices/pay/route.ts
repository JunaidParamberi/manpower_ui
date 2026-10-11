import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { processPaymentEvent } from "@/lib/payments/process-payment-event";

export const runtime = "nodejs";

/**
 * Mock checkout endpoint (frontend-only build — no payment provider behind it).
 * Mirrors the shape of a future Stripe webhook handler: resolves the invoice
 * by its pay token, then hands off to processPaymentEvent with an idempotency
 * key. Swapping in Stripe later = verify signature, map event →
 * PaymentEventInput, call the same function.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const payToken =
    body !== null &&
    typeof body === "object" &&
    "pay_token" in body &&
    typeof (body as Record<string, unknown>).pay_token === "string"
      ? ((body as Record<string, unknown>).pay_token as string)
      : null;

  if (!payToken) {
    return NextResponse.json({ error: "Missing pay_token" }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  const { data: doc, error } = await supabaseAdmin
    .from("documents")
    .select("id, user_id, status, type")
    .eq("pay_token", payToken)
    .eq("type", "invoice")
    .single();

  if (error || !doc) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const result = await processPaymentEvent(supabaseAdmin, doc.user_id, null, {
    documentId: doc.id,
    // amount omitted → pays the full remaining balance
    method: "card",
    provider: "mock",
    // Idempotency: one successful mock payment per token. A real Stripe
    // handler uses the Stripe event id here instead.
    externalId: `mock:${payToken}`,
  });

  if (!result.ok) {
    const alreadySettled = result.error.includes("no remaining balance");
    return NextResponse.json(
      { error: alreadySettled ? "Already paid" : result.error },
      { status: alreadySettled ? 409 : 422 },
    );
  }

  revalidateTag("finance");
  revalidateTag("dashboard");
  revalidateTag("documents");

  if (result.replayed) {
    return NextResponse.json({ error: "Already paid" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
