import type { PlanTier } from "@/config/plans";

export const AGENT_IDS = [
  "router",
  "document-writer",
  "finance-analyst",
  "communication-drafter",
  "content-marketer",
  "project-intelligence",
  "relationship-manager",
  "pricing-advisor",
  "business-strategist",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export const AGENT_LABELS: Record<AgentId, string> = {
  router: "Router",
  "document-writer": "Document Writer",
  "finance-analyst": "Finance Analyst",
  "communication-drafter": "Communication Drafter",
  "content-marketer": "Content Marketer",
  "project-intelligence": "Project Intelligence",
  "relationship-manager": "Relationship Manager",
  "pricing-advisor": "Pricing Advisor",
  "business-strategist": "Business Strategist",
};

const FREE_AGENTS: AgentId[] = ["router", "document-writer"];

const STARTER_AGENTS: AgentId[] = [
  ...FREE_AGENTS,
  "finance-analyst",
  "communication-drafter",
  "content-marketer",
  "project-intelligence",
  "relationship-manager",
];

const PRO_AGENTS: AgentId[] = [...AGENT_IDS];

export function getAgentsForPlan(tier: PlanTier): AgentId[] {
  switch (tier) {
    case "free":
      return FREE_AGENTS;
    case "starter":
      return STARTER_AGENTS;
    case "pro":
    case "agency":
      return PRO_AGENTS;
    default:
      return FREE_AGENTS;
  }
}

export function isAgentId(value: string): value is AgentId {
  return (AGENT_IDS as readonly string[]).includes(value);
}

export function getAgentLabel(agentId: AgentId): string {
  return AGENT_LABELS[agentId];
}
