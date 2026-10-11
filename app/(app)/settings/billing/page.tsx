import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { BillingPageClient } from "@/components/features/billing/billing-page-client";
import { getCurrentSubscription, getSubscriptionInvoices } from "@/lib/billing/queries";
import { getClientCountForUser, getDocCountThisMonthForUser } from "@/lib/dashboard/shell-count-queries";
import type { PlanTier } from "@/config/plans";

export const metadata = { title: "Billing & Plans — Manpower" };

export default async function BillingPage() {
  const { supabase, user } = await getServerContext();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  const planTier = (profile?.plan_tier ?? "free") as PlanTier;

  const [subscription, clientCount, docCountThisMonth] = await Promise.all([
    getCurrentSubscription(),
    getClientCountForUser(),
    getDocCountThisMonthForUser(),
  ]);

  const invoices = await getSubscriptionInvoices(subscription?.lemon_squeezy_id ?? null);

  return (
    <Suspense>
      <BillingPageClient
        currentPlan={planTier}
        subscription={subscription}
        clientCount={clientCount}
        docCountThisMonth={docCountThisMonth}
        invoices={invoices}
      />
    </Suspense>
  );
}
