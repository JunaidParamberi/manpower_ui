"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { WORKER_LENSES, type WorkerLens } from "@/lib/workers/worker-readiness";
import { cn } from "@/lib/utils";

type Edges = { start: boolean; end: boolean };

/** Fade on whichever side still has chips hidden. */
const FADE: Record<string, string> = {
  none: "",
  end: "[mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]",
  start: "[mask-image:linear-gradient(to_left,black_calc(100%-28px),transparent)]",
  both: "[mask-image:linear-gradient(to_right,transparent,black_28px,black_calc(100%-28px),transparent)]",
};

/**
 * All / Needs you / Ready / Deployed as chips with counts. In a narrow pane the row scrolls
 * sideways with no visible scrollbar; a soft fade shows there is more.
 */
export function WorkerLensChips({
  lens,
  counts,
  onChange,
  className,
}: {
  lens: WorkerLens;
  counts: Record<WorkerLens, number>;
  onChange: (lens: WorkerLens) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<Edges>({ start: false, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setHidden({ start: el.scrollLeft > 1, end: el.scrollLeft < max - 1 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  // Keep the selected chip in view when the lens changes (e.g. from the URL).
  useEffect(() => {
    ref.current
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [lens]);

  const fade = hidden.start && hidden.end ? "both" : hidden.start ? "start" : hidden.end ? "end" : "none";

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Show"
      onScroll={measure}
      className={cn(
        "scroll-x flex min-w-0 items-center gap-1.5 scroll-smooth",
        FADE[fade],
        className,
      )}
    >
      {WORKER_LENSES.map((l) => {
        const on = lens === l.id;
        const alert = l.id === "needs-you" && counts["needs-you"] > 0;
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
