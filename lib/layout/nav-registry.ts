/**
 * Canonical sidebar nav item ids, grouped by section, in default order.
 * Mirrors `NAV_SECTIONS` in `components/layout/sidebar.tsx` — the two must
 * stay in sync (ids here, icons/hrefs/labels there). Kept as plain data
 * (no component imports) so it's safe to use from both the client sidebar
 * and server layout queries.
 */
export const NAV_SECTION_ITEM_IDS = [
  ["dashboard", "tasks", "time"],
  ["clients", "projects", "documents", "services", "marketing"],
  ["finance", "expenses"],
] as const;

export const NAV_ITEM_IDS = NAV_SECTION_ITEM_IDS.flat();

export type NavItemId = (typeof NAV_ITEM_IDS)[number];

/** Maps each item id to the index of the section it belongs to (fixed — sections themselves aren't reorderable). */
export const NAV_ITEM_SECTION_INDEX: Record<NavItemId, number> = NAV_SECTION_ITEM_IDS.reduce(
  (acc, ids, sectionIndex) => {
    for (const id of ids) acc[id] = sectionIndex;
    return acc;
  },
  {} as Record<NavItemId, number>,
);

export type NavLayout = {
  order: NavItemId[];
  hidden: NavItemId[];
};

/**
 * Reconciles a stored nav layout with the current registry: known ids keep
 * their stored relative order (within their fixed section), unknown ids
 * (renamed/removed nav items) are dropped, and any new item ids shipped
 * since the layout was saved are appended so they stay visible by default.
 */
export function mergeNavLayout(
  storedOrder: readonly string[],
  storedHidden: readonly string[],
): NavLayout {
  const known = new Set<string>(NAV_ITEM_IDS);
  const seen = new Set<string>();
  const order: NavItemId[] = [];

  for (const id of storedOrder) {
    if (known.has(id) && !seen.has(id)) {
      order.push(id as NavItemId);
      seen.add(id);
    }
  }
  for (const id of NAV_ITEM_IDS) {
    if (!seen.has(id)) order.push(id);
  }

  const hidden = storedHidden.filter((id): id is NavItemId => known.has(id));

  return { order, hidden };
}

/** Groups a flat order array back into per-section id lists for rendering. */
export function groupNavOrderBySection(order: readonly NavItemId[]): NavItemId[][] {
  return NAV_SECTION_ITEM_IDS.map((_, sectionIndex) =>
    order.filter((id) => NAV_ITEM_SECTION_INDEX[id] === sectionIndex),
  );
}
