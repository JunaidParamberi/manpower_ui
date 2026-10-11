export type PlanTier = "free" | "starter" | "pro" | "agency";

// Billing currency. Lemon Squeezy store #373775 is denominated in AED and its
// currency is fixed at store creation, so all displayed prices must be AED to
// match what the customer is actually charged at checkout.
export const CURRENCY = "AED";

/** Format a whole-number price in the billing currency, e.g. 69 → "AED 69". */
export function formatPrice(amount: number): string {
  return `${CURRENCY} ${amount}`;
}

/**
 * Plans whose accounts are scanned by the nightly agents (Project
 * Intelligence, Follow-Up Engine, Relationship Manager). Mirrors the
 * ELIGIBLE_PLAN_TIERS constant in each Edge Function — Deno functions can't
 * import from the app, so the two must be changed together.
 */
export const NIGHTLY_AGENT_TIERS: readonly PlanTier[] = ["starter", "pro", "agency"];

export function hasNightlyAgents(tier: PlanTier): boolean {
  return NIGHTLY_AGENT_TIERS.includes(tier);
}

export interface PlanConfig {
  id: PlanTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  limits: {
    clients: number | "unlimited";
    docsPerMonth: number | "unlimited";
    aiActionsPerMonth: number | "unlimited";
    teamMembers: number | "unlimited";
  };
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Get started at no cost",
    features: [
      "3 clients",
      "5 documents/month",
      "2 templates",
      "20 AI actions/month",
      "Router + Document Writer agents",
      "Claude connector (MCP)",
    ],
    limits: {
      clients: 3,
      docsPerMonth: 5,
      aiActionsPerMonth: 20,
      teamMembers: 1,
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPrice: 69,
    annualPrice: 55,
    description: "For growing freelancers",
    features: [
      "15 clients",
      "Unlimited documents",
      "All templates",
      "100 AI actions/month",
      "Agents 1–4 (incl. Project Intelligence)",
      "Claude connector (MCP)",
    ],
    limits: {
      clients: 15,
      docsPerMonth: "unlimited",
      aiActionsPerMonth: 100,
      teamMembers: 1,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPrice: 179,
    annualPrice: 143,
    description: "Unlimited power for serious freelancers",
    features: [
      "Unlimited clients",
      "Unlimited documents",
      "All agents (incl. Pricing Advisor + Strategist)",
      "Unlimited AI actions",
      "Custom portal domain",
      "REST API access",
    ],
    limits: {
      clients: "unlimited",
      docsPerMonth: "unlimited",
      aiActionsPerMonth: "unlimited",
      teamMembers: 1,
    },
  },
  agency: {
    id: "agency",
    name: "Agency",
    monthlyPrice: 369,
    annualPrice: 295,
    description: "For teams and agencies",
    features: [
      "Everything in Pro",
      "5 team members",
      "Shared workspace",
      "White-label client portal",
    ],
    limits: {
      clients: "unlimited",
      docsPerMonth: "unlimited",
      aiActionsPerMonth: "unlimited",
      teamMembers: 5,
    },
  },
};

export const PLAN_ORDER: PlanTier[] = ["free", "starter", "pro", "agency"];

export function isPlanAtLeast(userPlan: PlanTier, required: PlanTier): boolean {
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(required);
}
