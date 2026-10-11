export const DASHBOARD_CARD_IDS = [
  "queue",
  "revenue",
  "activity",
  "brief",
  "work",
  "clients",
] as const;

export type DashboardCardId = (typeof DASHBOARD_CARD_IDS)[number];

export const DASHBOARD_CARD_LABELS: Record<DashboardCardId, string> = {
  queue: "Needs you",
  revenue: "Revenue",
  activity: "Activity",
  brief: "Today's brief",
  work: "Work",
  clients: "Clients",
};

export type DashboardLayout = {
  order: DashboardCardId[];
  hidden: DashboardCardId[];
};

/**
 * Reconciles a stored layout with the current card registry: known ids keep
 * their stored position, unknown ids (renamed/removed cards) are dropped,
 * and any new card ids shipped since the layout was saved are appended so
 * they're visible by default rather than silently missing.
 */
export function mergeDashboardLayout(
  storedOrder: readonly string[],
  storedHidden: readonly string[],
): DashboardLayout {
  const known = new Set<string>(DASHBOARD_CARD_IDS);
  const seen = new Set<string>();
  const order: DashboardCardId[] = [];

  for (const id of storedOrder) {
    if (known.has(id) && !seen.has(id)) {
      order.push(id as DashboardCardId);
      seen.add(id);
    }
  }
  for (const id of DASHBOARD_CARD_IDS) {
    if (!seen.has(id)) order.push(id);
  }

  const hidden = storedHidden.filter((id): id is DashboardCardId => known.has(id));

  return { order, hidden };
}
