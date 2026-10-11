import { PLANS, PLAN_ORDER } from "@/config/plans";
import type { PlanTier } from "@/config/plans";

export type LimitKey = "clients" | "docsPerMonth";
/**
 * How close a plan limit is to being hit. Named by meaning, not by hue — the
 * previous "emerald" | "amber" | "red" tied this domain helper to a specific
 * palette, and the UI maps these to --success / --warning / --destructive.
 */
export type UsageLevel = "ok" | "warn" | "danger";

export interface PlanUsage {
  planTier: PlanTier;
  clientCount: number;
  docCountThisMonth: number;
}

export function getPlanLimit(tier: PlanTier, key: LimitKey): number {
  const val = PLANS[tier].limits[key];
  return val === "unlimited" ? Infinity : val;
}

export function getUsageRatio(used: number, limit: number): number {
  if (limit === Infinity) return 0;
  return used / limit;
}

export function getUsageLevel(ratio: number): UsageLevel {
  if (ratio > 0.8) return "danger";
  if (ratio > 0.6) return "warn";
  return "ok";
}

export function shouldShowBanner(usage: PlanUsage): boolean {
  const { planTier, clientCount, docCountThisMonth } = usage;
  if (PLAN_ORDER.indexOf(planTier) >= PLAN_ORDER.indexOf("pro")) return false;
  const clientRatio = getUsageRatio(clientCount, getPlanLimit(planTier, "clients"));
  const docRatio = getUsageRatio(docCountThisMonth, getPlanLimit(planTier, "docsPerMonth"));
  return clientRatio >= 0.8 || docRatio >= 0.8;
}

export function startOfCurrentMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
}

export function getBannerMessage(usage: PlanUsage): string {
  const { planTier, clientCount, docCountThisMonth } = usage;
  const clientLimit = getPlanLimit(planTier, "clients");
  const docLimit = getPlanLimit(planTier, "docsPerMonth");
  const clientRatio = getUsageRatio(clientCount, clientLimit);
  const docRatio = getUsageRatio(docCountThisMonth, docLimit);

  if (clientRatio >= docRatio && clientRatio >= 0.8) {
    const remaining = clientLimit - clientCount;
    return remaining === 0
      ? `Client limit reached (${clientCount}/${clientLimit}) — upgrade to add more`
      : `${clientCount}/${clientLimit} clients used — ${remaining} remaining`;
  }
  const remaining = docLimit - docCountThisMonth;
  return remaining === 0
    ? `Document limit reached (${docCountThisMonth}/${docLimit}) — upgrade for unlimited`
    : `${docCountThisMonth}/${docLimit} documents used this month — ${remaining} remaining`;
}
