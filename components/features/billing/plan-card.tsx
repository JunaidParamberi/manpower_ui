"use client";

import { Check, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { AiIcon } from "@/components/shared/ai-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLAN_ORDER, formatPrice, type PlanTier, type PlanConfig } from "@/config/plans";

interface PlanCardProps {
  plan: PlanConfig;
  currentPlan: PlanTier;
  onUpgrade: (plan: PlanTier) => void;
  onManageBilling: () => void;
  loading: boolean;
}

/**
 * Tiers are told apart by rank, not by hue. The system allows one accent, so
 * the recommended tier gets it and every other tier is muted — the plan name,
 * the "Most popular" badge and the card ring already carry the hierarchy. The
 * old sky / amber / indigo scheme was three unrelated hues doing that job.
 */
const PLAN_BADGE: Record<PlanTier, string> = {
  free: "bg-muted text-muted-foreground border-border",
  starter: "bg-muted text-muted-foreground border-border",
  pro: "border-transparent bg-[var(--accent-soft)] text-primary",
  agency: "bg-muted text-muted-foreground border-border",
};

const PLAN_CHECK: Record<PlanTier, string> = {
  free: "text-muted-foreground",
  starter: "text-muted-foreground",
  // Only the recommended tier is accented — see the note on PLAN_BADGE.
  pro: "text-primary",
  agency: "text-muted-foreground",
};

export function PlanCard({
  plan,
  currentPlan,
  onUpgrade,
  onManageBilling,
  loading,
}: PlanCardProps) {
  const isPro = plan.id === "pro";
  const isCurrent = currentPlan === plan.id;
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const planIdx = PLAN_ORDER.indexOf(plan.id);
  const isUpgrade = planIdx > currentIdx;
  const isDowngrade = planIdx < currentIdx;

  const annualSavings =
    plan.monthlyPrice > 0
      ? Math.round((plan.monthlyPrice - plan.annualPrice) * 12)
      : 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col h-full rounded-xl border bg-card transition-shadow duration-200",
        isPro && !isCurrent
          ? "ring-2 ring-primary/20 border-primary/30 shadow-sm"
          : "border-border",
        isCurrent && "ring-2 ring-primary/30 border-primary/40",
        !isCurrent && "hover:shadow-md",
      )}
    >
      {isPro && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          {/* The accent marks the recommended plan, matching the ring on this
              same card. The design system allows one accent and no decorative
              gradients, so the amber→orange wash is gone. */}
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold tracking-wide text-primary-foreground shadow-sm">
            <AiIcon size={12} className="shrink-0" />
            Most popular
          </span>
        </div>
      )}

      <div className="flex flex-col flex-1 p-5 pt-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-heading text-[15px] font-bold tracking-tight text-foreground">
              {plan.name}
            </h3>
            {isCurrent && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-widest border px-2 py-0.5",
                  PLAN_BADGE[plan.id],
                )}
              >
                Current
              </Badge>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground leading-snug">{plan.description}</p>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-end gap-1">
            {plan.monthlyPrice === 0 ? (
              <span className="font-heading text-3xl font-extrabold tracking-tight text-foreground leading-none">
                Free
              </span>
            ) : (
              <>
                <span className="font-heading text-3xl font-extrabold tracking-tight text-foreground leading-none">
                  {formatPrice(plan.monthlyPrice)}
                </span>
                <span className="mb-0.5 text-[12px] text-muted-foreground font-medium">/mo</span>
              </>
            )}
          </div>
          {annualSavings > 0 && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Save{" "}
              <span className="font-semibold text-[var(--success)]">
                {formatPrice(annualSavings)}/yr
              </span>{" "}
              with annual billing
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="mb-4 h-px bg-border" />

        {/* Features */}
        <ul className="flex flex-col gap-2 flex-1 mb-5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-[12px]">
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted">
                <Check className={cn("size-2.5 stroke-[2.5]", PLAN_CHECK[plan.id])} strokeWidth={1.6} />
              </span>
              <span className="text-foreground/80 leading-snug">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {isCurrent ? (
          <p className="text-center text-[12px] text-muted-foreground py-1.5">
            Your current plan
          </p>
        ) : isUpgrade ? (
          <Button
            onClick={() => onUpgrade(plan.id)}
            disabled={loading}
            className={cn(
              "w-full text-[13px] font-semibold tracking-wide",
              isPro
                ? "border-0 bg-primary text-primary-foreground shadow-sm hover:bg-[var(--accent-hover)]"
                : "bg-foreground text-background hover:bg-foreground/90",
            )}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={1.6} />
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Upgrade to {plan.name}
                <ArrowRight className="size-3.5" strokeWidth={1.6} />
              </span>
            )}
          </Button>
        ) : isDowngrade ? (
          <Button
            variant="ghost"
            onClick={onManageBilling}
            disabled={loading}
            className="w-full text-[12px] font-medium text-muted-foreground hover:text-foreground"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={1.6} />
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <ChevronDown className="size-3.5" strokeWidth={1.6} />
                Switch plan
              </span>
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
