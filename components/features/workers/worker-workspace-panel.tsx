"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";

import type { WorkerFormInsights } from "@/lib/workers/worker-form-insights";
import type { WorkerStatusValue } from "@/lib/validations/worker";

import { WorkspaceInsightCard } from "@/components/shared/workspace-form-shell";
import { Badge } from "@/components/ui/badge";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STATUS_PILL: Record<WorkerStatusValue, string> = {
  deployed: "bg-[var(--accent-soft)] text-primary",
  available: "bg-[var(--success-soft)] text-[var(--success)]",
  on_leave: "bg-[var(--warning-soft)] text-[var(--warning)]",
  inactive: "bg-[var(--bg-subtle)] text-[var(--fg-2)]",
};

type WorkerWorkspacePanelProps = {
  insights: WorkerFormInsights;
  mode: "create" | "edit";
  /** Scrolls to and focuses the field for a missing item (by DOM id). */
  onJump?: (fieldId: string) => void;
};

export function WorkerWorkspacePanel({
  insights,
  mode,
  onJump,
}: WorkerWorkspacePanelProps) {
  const hasMissingEssentials = insights.missingEssentials.length > 0;
  const missingItems = insights.completionItems.filter(
    (item) => !item.complete,
  );
  const workLine = [
    insights.supplierLabel,
    insights.clientsCount > 0
      ? `${insights.clientsCount} client site${insights.clientsCount === 1 ? "" : "s"}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <WorkspaceInsightCard
        title="Live worker preview"
        description="This is how the record will read after saving."
        action={
          <Badge variant={hasMissingEssentials ? "outline" : "accent"}>
            {mode === "create" ? "Draft" : "Editing"}
          </Badge>
        }
      >
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[var(--accent-soft)] text-body font-semibold text-primary">
              {insights.monogram}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 font-heading text-base font-semibold tracking-tight">
                  {insights.displayName}
                </p>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center rounded-full px-2 py-px text-xs font-medium",
                    STATUS_PILL[insights.status],
                  )}
                >
                  {insights.statusLabel}
                </span>
              </div>
              {insights.metaLabel ? (
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {insights.metaLabel}
                </p>
              ) : null}
              {workLine ? (
                <p className="truncate text-sm text-muted-foreground">
                  {workLine}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </WorkspaceInsightCard>

      <WorkspaceInsightCard title="Registry readiness">
        <div className="flex flex-col gap-4">
          <Progress value={insights.completionPercent}>
            <ProgressLabel>Essential details</ProgressLabel>
            <ProgressValue>
              {() => `${insights.completedCount}/${insights.totalCount}`}
            </ProgressValue>
          </Progress>

          <div className="flex flex-col gap-2">
            {insights.completionItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                {item.complete ? (
                  <CheckCircle2
                    className="size-4 text-[var(--success)]"
                    strokeWidth={1.6}
                  />
                ) : (
                  <AlertCircle
                    className="size-4 text-muted-foreground"
                    strokeWidth={1.6}
                  />
                )}
                <span
                  className={
                    item.complete ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {insights.nextExpiryLabel ? (
            <p className="text-sm text-muted-foreground">
              Next expiry: {insights.nextExpiryLabel}
            </p>
          ) : null}
        </div>
      </WorkspaceInsightCard>

      <WorkspaceInsightCard
        title={hasMissingEssentials ? "Before you save" : "Ready for documents"}
      >
        {hasMissingEssentials ? (
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            {/* missingEssentials mirrors the filtered completionItems 1:1 (same filter, same order). */}
            {missingItems.map((item, i) => (
              <li key={item.id}>
                {onJump ? (
                  <button
                    type="button"
                    onClick={() => onJump(item.jumpTarget)}
                    className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <span>{insights.missingEssentials[i]}</span>
                    <span
                      aria-hidden
                      className="text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </button>
                ) : (
                  <span className="block py-1">
                    {insights.missingEssentials[i]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Identity and document details are on file. Passport, Emirates ID and
            insurance documents can be uploaded from the worker page after
            saving.
          </p>
        )}
      </WorkspaceInsightCard>
    </>
  );
}
