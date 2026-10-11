import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from "date-fns";

import type { AttentionItem, AttentionItemType } from "./types";

export type ProjectRisk = "overdue" | "at_risk" | "watch" | "on_track";

export function classifyProjectRisk(
  deadline: Date | null,
  now = new Date()
): ProjectRisk {
  if (!deadline) return "on_track";

  const today = startOfDay(now);
  const end = startOfDay(deadline);
  const days = differenceInCalendarDays(end, today);

  if (days < 0) return "overdue";
  if (days <= 7) return "at_risk";
  if (days <= 14) return "watch";
  return "on_track";
}

export function formatPipelineDaysLabel(
  deadline: Date | null,
  now = new Date()
): string {
  if (!deadline) return "no deadline";

  const today = startOfDay(now);
  const end = startOfDay(deadline);
  const days = differenceInCalendarDays(end, today);

  if (days < 0) {
    const n = Math.abs(days);
    return `overdue by ${n} day${n === 1 ? "" : "s"}`;
  }
  if (days === 0) return "due today";
  if (days <= 14) return `due in ${days} day${days === 1 ? "" : "s"}`;
  return `due ${format(deadline, "MMM d")}`;
}

export function riskIndicatorLabel(risk: ProjectRisk): string {
  switch (risk) {
    case "overdue":
      return "Overdue";
    case "at_risk":
      return "At risk";
    case "watch":
      return "Watch";
    case "on_track":
      return "On track";
  }
}

/** Drop no-response quotes when the same quote is already expiring. */
export function deduplicateAttentionItems(items: AttentionItem[]): AttentionItem[] {
  const expiringQuoteIds = new Set(
    items
      .filter((i) => i.type === "expiring_quote")
      .map((i) => i.id)
  );

  return items.filter(
    (i) =>
      !(i.type === "quote_no_response" && expiringQuoteIds.has(i.id))
  );
}

export function sortAttentionItems(items: AttentionItem[]): AttentionItem[] {
  const order: Record<AttentionItemType, number> = {
    overdue_invoice: 0,
    overdue_task: 1,
    expiring_quote: 2,
    project_deadline: 3,
    quote_no_response: 4,
  };

  return [...items].sort((a, b) => {
    const typeDiff = order[a.type] - order[b.type];
    if (typeDiff !== 0) return typeDiff;

    switch (a.type) {
      case "overdue_invoice":
      case "overdue_task":
      case "quote_no_response":
        return b.urgencyDays - a.urgencyDays;
      case "expiring_quote":
      case "project_deadline":
        return a.urgencyDays - b.urgencyDays;
      default:
        return 0;
    }
  });
}

export function parseDeadlineDate(iso: string | null): Date | null {
  if (!iso?.trim()) return null;
  const d = parseISO(iso.includes("T") ? iso : `${iso.trim()}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
