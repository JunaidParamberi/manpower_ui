/**
 * Pure predicate behind `useAgentGlow`. Kept separate from the hook so the
 * timing logic is unit-testable without React/jsdom (this repo's Vitest
 * config runs in `environment: "node"` with no DOM — see vitest.config.ts).
 */
export function isGlowing(publishedAt: number | null, now: number, durationMs: number): boolean {
  if (publishedAt === null) {
    return false;
  }
  return now - publishedAt < durationMs;
}
