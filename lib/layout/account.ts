import { PLAN_ORDER, type PlanTier } from "@/config/plans";
import {
  getPlanLimit,
  getUsageLevel,
  getUsageRatio,
  type LimitKey,
  type PlanUsage,
  type UsageLevel,
} from "@/lib/plan-usage/helpers";

/** Gradient pairs for the initials avatar (start, end). */
export const AVATAR_PALETTES = [
  ["#3550E0", "#6E83F0"],
  ["#1F8A52", "#3FB87D"],
  ["#B36A12", "#E0995E"],
  ["#C13838", "#E76B6B"],
  ["#2F6FB8", "#6FA8E6"],
  ["#6B4FA8", "#9B7FD8"],
] as const;

export type AvatarPalette = (typeof AVATAR_PALETTES)[number];

/** Same initials → same gradient, everywhere the avatar shows. */
export function avatarPalette(initials: string): AvatarPalette {
  let h = 0;
  for (let i = 0; i < initials.length; i++) h = (h * 31 + initials.charCodeAt(i)) & 0xffffff;
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length];
}

export const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

export function canUpgrade(tier: PlanTier): boolean {
  return PLAN_ORDER.indexOf(tier) < PLAN_ORDER.indexOf("pro");
}

export type PlanUsageRow = {
  key: LimitKey;
  label: string;
  used: number;
  limit: number;
  /** 0..1, capped. */
  ratio: number;
  level: UsageLevel;
};

const USAGE_LABELS: Record<LimitKey, string> = {
  clients: "Clients",
  docsPerMonth: "Documents this month",
};

/** Usage bars for the account menu. Unlimited limits have nothing to show. */
export function planUsageRows(usage: PlanUsage): PlanUsageRow[] {
  const entries: [LimitKey, number][] = [
    ["clients", usage.clientCount],
    ["docsPerMonth", usage.docCountThisMonth],
  ];
  return entries.flatMap(([key, used]) => {
    const limit = getPlanLimit(usage.planTier, key);
    if (!Number.isFinite(limit)) return [];
    const ratio = Math.min(1, getUsageRatio(used, limit));
    return [{ key, label: USAGE_LABELS[key], used, limit, ratio, level: getUsageLevel(ratio) }];
  });
}
