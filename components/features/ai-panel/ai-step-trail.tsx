"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, RotateCw, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { entityPath, ENTITY_LABELS } from "@/lib/routes";
import {
  presentTrailSteps,
  recordsForSteps,
  trailSummary,
  type PresentedStepStatus,
  type TrailStep,
} from "@/lib/ai-panel/trail-steps";
import type { ActionEvent } from "@/lib/assistant/stream-events";

type AiStepTrailProps = {
  steps: TrailStep[];
  /** Completed writes this turn; each with a record id becomes a chip under its step. */
  actions?: ActionEvent[];
  /** The turn paused on a risky write: show a final "Waiting for your OK" step. */
  waitingOnConfirm?: boolean;
};

function StepDot({ status }: { status: PresentedStepStatus | "waiting" }) {
  if (status === "retried") {
    return (
      <span
        className="mt-px grid size-[18px] place-items-center rounded-full bg-[var(--bg-subtle)] text-[var(--fg-3)]"
        aria-hidden
      >
        <RotateCw className="size-2.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (status === "running") {
    return <span className="kraft-step__spinner mt-px block size-[18px] rounded-full" aria-hidden />;
  }
  if (status === "waiting") {
    return (
      <span
        className="mt-px grid size-[18px] place-items-center rounded-full bg-[var(--warning-soft)] text-[11px] font-bold text-[var(--warning)]"
        aria-hidden
      >
        !
      </span>
    );
  }
  const Icon = status === "done" ? Check : X;
  return (
    <span
      className={cn(
        "mt-px grid size-[18px] place-items-center rounded-full text-[var(--fg-on-accent)]",
        status === "done" ? "bg-[var(--success)]" : "bg-[var(--danger)]",
      )}
      aria-hidden
    >
      <Icon className="size-3" strokeWidth={3} />
    </span>
  );
}

/** Entity + summary; when the step already reads as the summary, the chip just offers the link. */
function RecordChip({ action, stepLabel }: { action: ActionEvent; stepLabel: string }) {
  const href = entityPath(action.entity, action.entityId);
  const label = ENTITY_LABELS[action.entity] ?? action.entity;
  const detail = action.summary === stepLabel ? (href ? "View →" : null) : action.summary;
  const content = (
    <>
      <span className="font-semibold">{label}</span>
      {detail ? <span className="truncate text-[var(--fg-2)]">{detail}</span> : null}
    </>
  );
  const className =
    "kraft-chip inline-flex max-w-full items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-[7px] py-0.5 text-[11.5px]";
  return href ? (
    <Link href={href} className={cn(className, "transition-colors hover:border-[var(--border-focus)]")}>
      {content}
    </Link>
  ) : (
    <span className={className}>{content}</span>
  );
}

/**
 * Kraft's work timeline, folded to one line: a status dot, the running
 * step's label while it works (or a count when done), and a chevron that
 * opens the full step list. Records the turn created or changed stay
 * visible as chips under the line, so their links never hide behind the
 * fold. A failure nothing recovered from opens the list by default.
 */
export function AiStepTrail({ steps, actions = [], waitingOnConfirm = false }: AiStepTrailProps) {
  const presented = presentTrailSteps(steps);
  const hasError = presented.some((step) => step.status === "error");
  const [expanded, setExpanded] = useState<boolean | null>(null);
  const listId = useId();

  if (steps.length === 0 && !waitingOnConfirm) {
    return null;
  }

  const records = recordsForSteps(steps, actions);
  const running = steps.some((step) => step.status === "running");
  const overall: PresentedStepStatus | "waiting" = waitingOnConfirm
    ? "waiting"
    : running
      ? "running"
      : hasError
        ? "error"
        : "done";
  const summary = waitingOnConfirm ? "Waiting for your OK" : trailSummary(steps);
  const isOpen = expanded ?? hasError;
  const chips = presented
    .map((step) => ({ step, record: records[step.index] }))
    .filter((row): row is { step: typeof row.step; record: ActionEvent } => Boolean(row.record?.entityId));

  return (
    <div className="flex flex-col gap-1.5" role="status">
      <button
        type="button"
        onClick={() => setExpanded(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={listId}
        className="group/trail inline-flex max-w-full items-center gap-2 self-start rounded-full border border-[var(--border)] bg-[var(--bg-canvas)] py-1 pr-2.5 pl-1 text-left transition-colors hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-ring)]"
      >
        <StepDot status={overall} />
        <span
          className={cn(
            "min-w-0 truncate text-[12.5px] font-medium",
            overall === "running" ? "kraft-step__shimmer" : "text-[var(--fg-2)]",
            overall === "waiting" && "text-[var(--warning)]",
            overall === "error" && "text-[var(--danger)]",
          )}
        >
          {summary}
        </span>
        <ChevronRight
          className={cn("size-3.5 shrink-0 text-[var(--fg-3)] transition-transform", isOpen && "rotate-90")}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {isOpen ? <TrailList id={listId} steps={steps} actions={actions} waitingOnConfirm={waitingOnConfirm} /> : null}

      {!isOpen && chips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chips.map(({ step, record }) => (
            <RecordChip key={`${step.tool}-${step.index}`} action={record} stepLabel={step.label} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The unfolded timeline: every tool call the assistant makes this
 * turn, reads and writes, in order, as a vertical list joined by a thin
 * connector. Running steps spin with a shimmering label, done steps show
 * the server's summary, and records the stream reported (create/update
 * with an id) appear as chips under the step that touched them. A failed
 * call the assistant recovered from reads as a muted "retried" step; only
 * unrecovered failures show red.
 */
function TrailList({ id, steps, actions = [], waitingOnConfirm = false }: AiStepTrailProps & { id: string }) {
  const records = recordsForSteps(steps, actions);
  const rows = [
    ...presentTrailSteps(steps).map((step) => ({
      key: `${step.tool}-${step.index}`,
      status: step.status as PresentedStepStatus | "waiting",
      label: step.label,
      record: records[step.index],
    })),
    ...(waitingOnConfirm
      ? [{ key: "waiting", status: "waiting" as const, label: "Waiting for your OK", record: null }]
      : []),
  ];

  return (
    <ol id={id} className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--bg-canvas)] px-3 py-2.5">
      {rows.map((row, index) => (
        <li
          key={row.key}
          className={cn(
            "kraft-step relative grid grid-cols-[18px_1fr] gap-2.5 pt-1",
            index === rows.length - 1 ? "pb-0.5" : "pb-2",
            index < rows.length - 1 &&
              "before:absolute before:top-[22px] before:-bottom-0.5 before:left-[8.5px] before:w-px before:bg-[var(--border-strong)] before:content-['']",
          )}
        >
          <StepDot status={row.status} />
          <div className="min-w-0">
            <p
              className={cn(
                "text-[13px] font-medium break-words",
                row.status === "running" && "kraft-step__shimmer",
                row.status === "error" && "text-[var(--danger)]",
                row.status === "waiting" && "text-[var(--warning)]",
                row.status === "done" && "text-foreground",
                row.status === "retried" && "font-normal text-[var(--fg-3)]",
              )}
            >
              {row.label}
            </p>
            {row.record?.entityId ? (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <RecordChip action={row.record} stepLabel={row.label} />
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
