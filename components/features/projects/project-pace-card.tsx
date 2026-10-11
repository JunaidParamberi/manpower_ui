import { PaceBar, PACE_TEXT } from "@/components/features/projects/pace-bar";
import type { Pace } from "@/lib/projects/project-pace";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

type Facts = { taskDone: number; taskTotal: number; loggedHours: number; spend: number; budget: number | null; currency: string };

/** The workspace's headline: pace verdict, the big pace bar and four facts. */
export function ProjectPaceCard({ pace, startLabel, dueLabel, facts }: { pace: Pace; startLabel: string; dueLabel: string | null; facts: Facts }) {
  const middle = pace.timeElapsed !== null && (pace.kind === "on_pace" || pace.kind === "ahead" || pace.kind === "behind" || pace.kind === "over_budget")
    ? `Today, ${Math.round(pace.timeElapsed * 100)}% of the time`
    : "";
  const items = [
    { label: "Tasks", value: <>{facts.taskDone} <small className="text-meta font-normal text-[var(--fg-3)]">of {facts.taskTotal}</small></> },
    { label: "Logged", value: `${facts.loggedHours}h` },
    { label: "Spent", value: formatCurrency(facts.spend, facts.currency) },
    { label: "Budget", value: facts.budget !== null ? formatCurrency(facts.budget, facts.currency) : "Not set" },
  ];
  return (
    <section className="rounded-xl border border-border bg-card px-4 pt-3.5 pb-3 shadow-[var(--shadow-xs)]" aria-label="Pace">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className={cn("text-body font-medium", PACE_TEXT[pace.kind])}>{pace.label}</span>
        <span className="text-meta text-[var(--fg-2)]">{pace.detail}</span>
      </div>
      <PaceBar pace={pace} size="lg" />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-label text-[var(--fg-3)]">
        <span>{startLabel}</span>
        <span className="flex flex-wrap items-center gap-x-3.5 gap-y-1" aria-hidden>
          <span className="inline-flex items-center gap-1.5"><i className="h-1 w-2.5 rounded-full bg-[var(--accent)]" />Work done</span>
          {pace.timeElapsed !== null ? <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-0.5 rounded-full bg-foreground" />{middle || "Time gone"}</span> : null}
          {pace.budgetUsed !== null ? <span className="inline-flex items-center gap-1.5"><i className="h-0.5 w-2.5 rounded-full bg-[var(--fg-3)]" />Budget used</span> : null}
        </span>
        <span>{dueLabel ? `Due ${dueLabel}` : "No deadline"}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-y-3 border-t border-border pt-3 @lg/shell:grid-cols-4">
        {items.map((item, i) => (
          <div key={item.label} className={cn("min-w-0 pe-3", i % 2 === 1 && "border-s border-border ps-3.5", i === 2 && "@lg/shell:border-s @lg/shell:ps-3.5")}>
            <dt className="text-meta text-[var(--fg-3)]">{item.label}</dt>
            <dd className="mt-0.5 truncate text-[14px] font-semibold tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
