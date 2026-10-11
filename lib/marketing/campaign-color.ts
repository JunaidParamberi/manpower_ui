/**
 * Stable per-campaign colour derived from the campaign id, so campaign
 * membership is visible on a chip without a `color` column on
 * content_campaigns. Static Tailwind arbitrary-value classes (not an inline
 * style prop) so the no-inline-styles rule holds and Tailwind can see them.
 * The --chart-* tokens are defined for both themes in styles/tokens.css.
 */
export const CAMPAIGN_COLOR_CLASSES = [
  "bg-[var(--chart-1)]",
  "bg-[var(--chart-2)]",
  "bg-[var(--chart-3)]",
  "bg-[var(--chart-4)]",
  "bg-[var(--chart-5)]",
] as const;

/** FNV-1a over the id, folded into the palette length. */
export function campaignColorIndex(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % CAMPAIGN_COLOR_CLASSES.length;
}

export function campaignColorClass(id: string | null): string {
  if (!id) return "bg-transparent";
  return CAMPAIGN_COLOR_CLASSES[campaignColorIndex(id)];
}
