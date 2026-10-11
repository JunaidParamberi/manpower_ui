import type { Pace, PaceKind } from "@/lib/projects/project-pace";
import { cn } from "@/lib/utils";

export const PACE_TEXT: Record<PaceKind, string> = {
  ahead: "text-[var(--success)]",
  on_pace: "text-[var(--success)]",
  behind: "text-[var(--warning)]",
  over_budget: "text-[var(--warning)]",
  late: "text-[var(--danger)]",
  not_started: "text-[var(--fg-3)]",
  paused: "text-[var(--fg-3)]",
  delivered: "text-[var(--success)]",
  no_dates: "text-[var(--fg-3)]",
  untracked: "text-[var(--fg-3)]",
};

const FILL: Record<PaceKind, string> = {
  ahead: "bg-[var(--accent)]",
  on_pace: "bg-[var(--accent)]",
  behind: "bg-[var(--warning)]",
  over_budget: "bg-[var(--warning)]",
  late: "bg-[var(--danger)]",
  not_started: "bg-[var(--fg-3)]",
  paused: "bg-[var(--fg-3)]",
  delivered: "bg-[var(--success)]",
  no_dates: "bg-[var(--accent)]",
  untracked: "bg-[var(--fg-3)]",
};

const HEIGHT = { sm: "h-1", md: "h-1.5", lg: "h-2" } as const;
const TICK = { sm: "-inset-y-0.5", md: "-inset-y-[3px]", lg: "-inset-y-1" } as const;

/**
 * Work done (fill) against schedule elapsed (tick), with budget used as a
 * hairline underneath. Fill behind the tick means behind.
 */
export function PaceBar({ pace, size = "md", showBudget = true, className }: { pace: Pace; size?: "sm" | "md" | "lg"; showBudget?: boolean; className?: string }) {
  const showTick = pace.timeElapsed !== null && (pace.kind === "ahead" || pace.kind === "on_pace" || pace.kind === "behind" || pace.kind === "over_budget" || pace.kind === "late");
  const label = `${Math.round(pace.workDone * 100)}% done${pace.timeElapsed !== null ? `, ${Math.round(pace.timeElapsed * 100)}% of the time gone` : ""}${pace.budgetUsed !== null ? `, ${Math.round(pace.budgetUsed * 100)}% of budget used` : ""}`;
  return (
    <div className={cn("min-w-0", className)} role="img" aria-label={label}>
      <div className={cn("relative rounded-full bg-[var(--bg-subtle)]", HEIGHT[size])}>
        <span
          className={cn("absolute inset-y-0 left-0 rounded-full", FILL[pace.kind])}
          // Width is data.
          style={{ width: `${Math.round(pace.workDone * 100)}%` }}
        />
        {showTick ? (
          <span
            className={cn("absolute w-0.5 -translate-x-1/2 rounded-full bg-foreground", TICK[size])}
            // Position is data.
            style={{ left: `${Math.round((pace.timeElapsed ?? 0) * 100)}%` }}
          />
        ) : null}
      </div>
      {showBudget && pace.budgetUsed !== null ? (
        <div className="relative mt-1 h-0.5 rounded-full bg-[var(--bg-subtle)]">
          <span
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              pace.kind === "over_budget" ? "bg-[var(--warning)]" : "bg-[var(--fg-3)]",
            )}
            // Width is data.
            style={{ width: `${Math.min(100, Math.round(pace.budgetUsed * 100))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
