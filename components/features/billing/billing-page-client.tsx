"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { createCheckoutUrl, manageBillingUrl } from "@/lib/billing/actions";
import { PLANS, PLAN_ORDER, type PlanTier } from "@/config/plans";
import { cn } from "@/lib/utils";
import type { Subscription } from "@/types";
import type { BillingInvoice } from "@/lib/billing/invoice-transform";
import { BillingCurrentPlan } from "./billing-current-plan";
import { PlanCard } from "./plan-card";
import { PlanUsageBars } from "./plan-usage-bars";
import { BillingInvoiceHistory } from "./billing-invoice-history";
import { BillingFaq } from "./billing-faq";

interface BillingPageClientProps {
  currentPlan: PlanTier;
  subscription: Subscription | null;
  clientCount: number;
  docCountThisMonth: number;
  invoices: BillingInvoice[];
}

export function BillingPageClient({
  currentPlan,
  subscription,
  clientCount,
  docCountThisMonth,
  invoices,
}: BillingPageClientProps) {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<PlanTier>(currentPlan);
  const [loading, setLoading] = useState(false);
  const isTestMode = process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      toast.success("Subscription activated! Your plan will update shortly.");
    }
  }, [searchParams]);

  async function handleUpgrade(targetPlan: PlanTier) {
    setLoading(true);
    const result = await createCheckoutUrl({ plan: targetPlan });
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error ?? "Upgrade failed");
      return;
    }

    if (result.url) {
      window.location.href = result.url;
    } else {
      setPlan(targetPlan);
      toast.success(`Switching to ${PLANS[targetPlan].name}… changes apply shortly.`);
    }
  }

  async function handleManageBilling() {
    setLoading(true);
    const result = await manageBillingUrl();
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error ?? "Could not open billing portal");
      return;
    }

    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  const usage = { planTier: plan, clientCount, docCountThisMonth };
  const hasSubscription = !!subscription?.lemon_squeezy_id;

  return (
    <div className="min-h-full space-y-8">
      {/* Dashed and muted rather than a colour of its own: this is temporary
          scaffolding, not a status the user needs to act on. */}
      {isTestMode && (
        <div className="flex items-center gap-2.5 rounded-lg border border-dashed border-border bg-muted/40 px-3.5 py-2.5">
          <FlaskConical className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.6} />
          <p className="text-[12px] text-muted-foreground">
            <span className="font-semibold">Test mode</span> — no real charges. Use Lemon Squeezy test card to try checkout.
          </p>
        </div>
      )}

      <PageHeader
        eyebrow="Settings"
        title="Billing &amp; Plans"
        description="Choose the plan that grows with your business. Upgrade or downgrade anytime."
      />

      {/* 1. Current plan */}
      <BillingCurrentPlan
        plan={plan}
        subscription={subscription}
        onManageBilling={handleManageBilling}
        onUpgrade={handleUpgrade}
        loading={loading}
      />

      {/* 2. Usage meters (free + starter only) */}
      {(plan === "free" || plan === "starter") && (
        <section>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Usage this month
          </p>
          <div className="rounded-xl border border-border bg-card px-4 py-4">
            <PlanUsageBars usage={usage} />
          </div>
        </section>
      )}

      {/* 3. Plan comparison */}
      <section>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Plans
        </p>
        <div className={cn("grid gap-4 items-stretch", "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4")}>
          {PLAN_ORDER.map((planId, i) => (
            <div
              key={planId}
              className="opacity-0 animate-[fadeUp_0.4s_ease_forwards] h-full"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <PlanCard
                plan={PLANS[planId]}
                currentPlan={plan}
                onUpgrade={handleUpgrade}
                onManageBilling={handleManageBilling}
                loading={loading}
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
          All prices in AED. Cancel or manage your subscription anytime via the billing portal.
        </p>
      </section>

      {/* 4. Invoice history */}
      {hasSubscription && (
        <BillingInvoiceHistory invoices={invoices} />
      )}

      {/* 5. FAQ */}
      <BillingFaq />
    </div>
  );
}
