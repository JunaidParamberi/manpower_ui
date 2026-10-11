"use client";

import { PORTFOLIO_LENSES, type PortfolioLens } from "@/lib/projects/portfolio-filters";
import { cn } from "@/lib/utils";

/** All / Needs you / Active / Planning / Done as chips with counts. */
export function ProjectLensChips({
  lens,
  counts,
  onChange,
  className,
}: {
  lens: PortfolioLens;
  counts: Record<PortfolioLens, number>;
  onChange: (lens: PortfolioLens) => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label="Show" className={cn("scroll-x flex min-w-0 items-center gap-1 overflow-x-auto", className)}>
      {PORTFOLIO_LENSES.map((l) => {
        const on = lens === l.id;
        const alert = l.id === "needs_you" && counts.needs_you > 0;
        return (
          <button
            key={l.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(l.id)}
            className={cn(
              "inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-meta font-medium transition-colors",
              on
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-transparent text-[var(--fg-2)] hover:border-[var(--border-strong)] hover:text-foreground",
            )}
          >
            {l.label}
            <span
              className={cn(
                "tabular-nums",
                on ? "text-background/70" : alert ? "font-semibold text-[var(--danger)]" : "font-normal text-[var(--fg-3)]",
              )}
            >
              {counts[l.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
