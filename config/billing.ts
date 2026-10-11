import type { PlanTier } from "@/config/plans";
import type { SubscriptionStatus } from "@/types";

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

export const PLAN_VARIANT: Record<Exclude<PlanTier, "free">, string> = {
  starter: requireEnv("LEMON_SQUEEZY_VARIANT_STARTER"),
  pro: requireEnv("LEMON_SQUEEZY_VARIANT_PRO"),
  agency: requireEnv("LEMON_SQUEEZY_VARIANT_AGENCY"),
};

const VARIANT_TO_PLAN: Record<string, Exclude<PlanTier, "free">> = Object.fromEntries(
  Object.entries(PLAN_VARIANT).map(([plan, variantId]) => [variantId, plan as Exclude<PlanTier, "free">]),
);

export function variantToPlan(variantId: string | number): PlanTier | null {
  return VARIANT_TO_PLAN[String(variantId)] ?? null;
}

export function lsStatusToLocal(lsStatus: string): SubscriptionStatus {
  switch (lsStatus) {
    case "on_trial":
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "paused":
      return "past_due";
    case "cancelled":
      return "cancelled";
    case "expired":
      return "expired";
    default:
      return "active";
  }
}
