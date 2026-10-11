import { cn } from "@/lib/utils";

/**
 * Calm, single-colour brand wash for the auth + onboarding shells. Replaces the
 * multicolour AmbientBackdrop with a subtle brand-blue glow derived from the
 * `--accent` token, so it tracks light/dark themes. Static (no motion) and
 * `fixed` so it stays put when a tall step scrolls. Decorative only.
 */
export function BrandGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "brand-canvas-glow pointer-events-none fixed inset-0 z-0",
        className,
      )}
    />
  );
}
