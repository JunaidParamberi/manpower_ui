import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type { BillingInvoice } from "@/lib/billing/invoice-transform";
import type { Subscription } from "@/types";

// Admin client — safe to use inside unstable_cache (no request context needed).
// Reads the mock `subscriptions` row seeded for the signed-in user.
const _cachedGetCurrentSubscription = unstable_cache(
  async (userId: string): Promise<Subscription | null> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return (data as Subscription | null) ?? null;
  },
  ["subscription"],
  { revalidate: 60, tags: ["subscription"] },
);

export async function getCurrentSubscription(): Promise<Subscription | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  return _cachedGetCurrentSubscription(user.id);
}

export type { BillingInvoice };

/**
 * Mock invoice history — no Lemon Squeezy call. Returns a couple of local
 * sample invoices for any non-empty subscription id, and `[]` when lsId is
 * null/empty. `invoiceUrl` is null so the UI renders the neutral "—"
 * placeholder instead of linking out to a real billing provider.
 */
export async function getSubscriptionInvoices(
  lsId: string | null,
): Promise<BillingInvoice[]> {
  if (!lsId) return [];
  console.log(`[mock-billing] invoice history for subscription ${lsId} (mock, no LemonSqueezy call)`);
  return [
    {
      id: "mock-invoice-2",
      status: "paid",
      totalFormatted: "AED 149.00",
      totalCents: 14900,
      currency: "AED",
      invoiceUrl: null,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      isTestMode: true,
    },
    {
      id: "mock-invoice-1",
      status: "paid",
      totalFormatted: "AED 149.00",
      totalCents: 14900,
      currency: "AED",
      invoiceUrl: null,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      isTestMode: true,
    },
  ];
}
