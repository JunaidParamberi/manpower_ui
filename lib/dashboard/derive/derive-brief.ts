import type { BriefFacts, BriefLine, MoneyFacts, QueueItem } from "@/lib/dashboard/snapshot-types";
import type { LatestDigest } from "@/lib/projects/digest-queries";
import { formatCurrency } from "@/lib/utils/format";

const DEFAULT_MAX_LINES = 3;

/** Queue severity maps onto the same three bands the digest uses. */
function bandForScore(score: number): BriefLine["band"] {
  if (score >= 120) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function linesFromDigest(digest: LatestDigest, maxLines: number): BriefLine[] {
  const bandByProject = new Map(digest.facts.projects.map((p) => [p.id, p.band]));

  return digest.actions.slice(0, maxLines).map((action, index) => ({
    id: `${action.projectId}-${index}`,
    title: action.title,
    detail: action.detail,
    href: `/projects/${action.projectId}`,
    band: bandByProject.get(action.projectId) ?? "low",
  }));
}

function linesFromFacts(queue: QueueItem[], money: MoneyFacts, maxLines: number): BriefLine[] {
  const lines: BriefLine[] = queue
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, maxLines)
    .map((item) => ({
      id: `${item.type}-${item.id}`,
      title: item.title,
      detail: item.clientName ? `${item.clientName} · ${item.detail}` : item.detail,
      href: item.href,
      band: bandForScore(item.score),
    }));

  if (lines.length < maxLines && money.overdueCount > 0) {
    lines.push({
      id: "money-overdue",
      title: formatCurrency(money.overdue, money.primaryCurrency),
      detail: `overdue across ${money.overdueCount} invoice${money.overdueCount === 1 ? "" : "s"}`,
      href: "/finance?status=overdue",
      band: "high",
    });
  }

  return lines;
}

/**
 * One brief, two sources. A narrated digest renders with AI attribution; every
 * other account gets the same shape computed from facts, with no invented
 * voice — an empty list is an honest "nothing to report".
 */
export function deriveBrief(args: {
  digest: LatestDigest | null;
  queue: QueueItem[];
  money: MoneyFacts;
  hasNightlyAgents: boolean;
  maxLines?: number;
}): BriefFacts {
  const maxLines = args.maxLines ?? DEFAULT_MAX_LINES;

  if (args.digest && (args.digest.narrative || args.digest.actions.length > 0)) {
    return {
      narrative: args.digest.narrative,
      digestDate: args.digest.digestDate,
      lines: linesFromDigest(args.digest, maxLines),
      showUpgradeHint: false,
    };
  }

  return {
    narrative: null,
    digestDate: null,
    lines: linesFromFacts(args.queue, args.money, maxLines),
    showUpgradeHint: !args.hasNightlyAgents,
  };
}
