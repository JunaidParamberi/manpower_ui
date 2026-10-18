"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { workerIssues } from "@/lib/workers/worker-readiness";
import type { WorkerListRow } from "@/types";

import { useWorkerHref } from "@/components/features/workers/detail/use-worker-href";

const SECTION = "mx-4 mt-5 overflow-hidden rounded-xl border border-border bg-card shadow-xs sm:mx-6 lg:mx-7";

const TONE_DOT = {
  danger: "bg-[var(--danger)]",
  warning: "bg-[var(--warning)]",
} as const;

/** The one card on the worker Overview: what blocks deployment, or that nothing does. */
export function WorkerReadinessPanel({ worker, nowIso }: { worker: WorkerListRow; nowIso: string }) {
  const issues = workerIssues(worker, nowIso);
  const hrefs = useWorkerHref();
  const ringColor = issues.some((i) => i.tone === "danger")
    ? "var(--danger)"
    : issues.length > 0
      ? "var(--warning)"
      : "var(--success)";

  return (
    <section className={SECTION} aria-label="Readiness">
      <header className="flex min-h-[46px] items-center gap-2.5 px-4 py-2.5">
        <span
          aria-hidden
          className="grid size-7 shrink-0 place-items-center rounded-full border-2 text-label font-semibold tabular-nums"
          style={{ borderColor: ringColor, color: ringColor }}
        >
          {issues.length === 0 ? <Check className="size-3.5" /> : issues.length}
        </span>
        <h3 className="flex-1 text-card-title">{issues.length > 0 ? "Needs attention" : "Ready to deploy"}</h3>
        {issues.length > 0 ? (
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={hrefs.detail(worker.id, "documents")} scroll={false} />}
          >
            Upload documents
          </Button>
        ) : null}
      </header>

      <ul className="border-t border-border">
        {issues.length === 0 ? (
          <li className="flex items-start gap-2.5 px-4 py-2.5">
            <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[var(--success)]" />
            <div className="min-w-0">
              <p className="text-body font-medium text-foreground">Passport, Emirates ID and visa on file</p>
              <p className="text-meta text-[var(--fg-3)]">Nothing expires in the next 30 days.</p>
            </div>
          </li>
        ) : (
          issues.map((issue) => (
            <li key={issue.id} className="flex items-start gap-2.5 border-t border-border px-4 py-2.5 first:border-t-0">
              <span aria-hidden className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", TONE_DOT[issue.tone])} />
              <div className="min-w-0">
                <p className="text-body font-medium text-foreground">{issue.title}</p>
                <p className="text-meta text-[var(--fg-3)]">{issue.detail}</p>
              </div>
            </li>
          ))
        )}
      </ul>

      <div className="flex items-center gap-2 border-t border-border px-4 py-2">
        <span className="flex-1 text-meta text-[var(--fg-3)]">Checked today</span>
      </div>
    </section>
  );
}
