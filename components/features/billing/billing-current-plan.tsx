"use client";

import {
  CalendarDays,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLANS, type PlanTier } from "@/config/plans";
import type { Subscription } from "@/types";

interface BillingCurrentPlanProps {
  plan: PlanTier;
  subscription: Subscription | null;
  onManageBilling: () => void;
  onUpgrade?: (plan: PlanTier) => void;
  loading: boolean;
}

type StatusVariant = "free" | "active" | "past_due" | "cancelled";

function getStatusVariant(plan: PlanTier, sub: Subscription | null): StatusVariant {
  if (plan === "free") return "free";
  if (sub?.status === "past_due") return "past_due";
  if (sub?.status === "cancelled") return "cancelled";
  return "active";
}

const STATUS_CONFIG: Record<
  StatusVariant,
  {
    icon: React.ElementType;
    iconClass: string;
    iconBg: string;
    badge: string;
    badgeLabel: string;
    cardClass: string;
  }
> = {
  free: {
    icon: CheckCircle2,
    iconClass: "text-muted-foreground",
    iconBg: "bg-muted",
    badge: "bg-muted text-muted-foreground border-border",
    badgeLabel: "Free",
    cardClass: "border-border bg-card",
  },
  active: {
    icon: CheckCircle2,
    iconClass: "text-[var(--success)]",
    iconBg: "bg-[var(--success-soft)]",
    badge:
      "border-transparent bg-[var(--success-soft)] text-[var(--success)]",
    badgeLabel: "Active",
    cardClass: "border-border bg-card",
  },
  past_due: {
    icon: AlertTriangle,
    iconClass: "text-[var(--warning)]",
    iconBg: "bg-[var(--warning-soft)]",
    badge:
      "border-transparent bg-[var(--warning-soft)] text-[var(--warning)]",
    badgeLabel: "Payment due",
    // The only status that tints its whole card — payment failure is the one
    // thing here the user must act on.
    cardClass: "border-[var(--warning)]/40 bg-[var(--warning-soft)]/40",
  },
  cancelled: {
    icon: XCircle,
    iconClass: "text-muted-foreground",
    iconBg: "bg-muted",
    badge: "bg-muted text-muted-foreground border-border",
    badgeLabel: "Cancels at period end",
    cardClass: "border-border bg-card",
  },
};

export function BillingCurrentPlan({
  plan,
  subscription,
  onManageBilling,
  onUpgrade,
  loading,
}: BillingCurrentPlanProps) {
  const planConfig = PLANS[plan];
  const variant = getStatusVariant(plan, subscription);
  const cfg = STATUS_CONFIG[variant];
  const Icon = cfg.icon;
  const isPaid = plan !== "free" && !!subscription?.lemon_squeezy_id;
  const isCancelled = variant === "cancelled";
  const periodEnd = subscription?.current_period_end;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border px-5 py-4 sm:flex-row sm:items-center",
        cfg.cardClass,
      )}
    >
      {/* Left: icon + plan name + status badge */}
      <div className="flex flex-1 items-center gap-3 min-w-0">
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", cfg.iconBg)}>
          <Icon className={cn("size-4", cfg.iconClass)} strokeWidth={1.6} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14px] font-semibold text-foreground">{planConfig.name} plan</p>
            <Badge
              variant="outline"
              className={cn("text-[11px] font-medium border px-2 py-0.5 rounded-full", cfg.badge)}
            >
              {cfg.badgeLabel}
            </Badge>
          </div>
          <p className="mt-0.5 text-[12px] text-muted-foreground truncate">{planConfig.description}</p>
        </div>
      </div>

      {/* Center: renewal date — hidden on mobile */}
      {periodEnd && plan !== "free" && (
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <CalendarDays className="size-3.5 text-muted-foreground" strokeWidth={1.6} />
          <span className="text-[12px] text-muted-foreground">
            {isCancelled ? "Access until" : "Renews"}{" "}
            <span className="font-medium text-foreground">
              {new Date(periodEnd).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </span>
        </div>
      )}

      {/* Right: CTA */}
      {isPaid ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onManageBilling}
          disabled={loading}
          className="shrink-0 gap-1.5 text-[12px]"
        >
          {loading ? (
            <Loader2 className="size-3 animate-spin" strokeWidth={1.6} />
          ) : (
            <>
              <ExternalLink className="size-3" strokeWidth={1.6} />
              Manage billing
            </>
          )}
        </Button>
      ) : plan === "free" && onUpgrade ? (
        <Button
          size="sm"
          onClick={() => onUpgrade("starter")}
          disabled={loading}
          className="shrink-0 gap-1.5 text-[12px] bg-foreground text-background hover:bg-foreground/90"
        >
          {loading ? (
            <Loader2 className="size-3 animate-spin" strokeWidth={1.6} />
          ) : (
            <>
              Upgrade
              <ArrowRight className="size-3" strokeWidth={1.6} />
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
}
