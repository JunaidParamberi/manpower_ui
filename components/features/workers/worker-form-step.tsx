import type { ReactNode } from "react";

import { CheckCircle2 } from "lucide-react";

import { WorkspaceFormSection } from "@/components/shared/workspace-form-shell";
import { cn } from "@/lib/utils";

type WorkerFormStepProps = {
  n: number;
  title: string;
  /** Short "why this step exists" line in the header — hidden on small screens. */
  hint?: string;
  /** Renders a "Required" tag when the step is not complete yet. */
  required?: boolean;
  complete: boolean;
  children: ReactNode;
};

/**
 * One numbered step of the worker form. A reading-order cue, not a wizard —
 * every step stays visible on one page; the tick reflects live completion.
 */
export function WorkerFormStep({
  n,
  title,
  hint,
  required,
  complete,
  children,
}: WorkerFormStepProps) {
  return (
    <WorkspaceFormSection
      title={
        <span className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid size-6 shrink-0 place-items-center rounded-full border border-border text-xs font-semibold",
              complete &&
                "border-transparent bg-[var(--success-soft)] text-[var(--success)]",
            )}
            aria-hidden
          >
            {n}
          </span>
          {title}
          {hint ? (
            <span className="hidden text-xs font-normal text-muted-foreground sm:inline">
              {hint}
            </span>
          ) : null}
        </span>
      }
      action={
        complete ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--success)]">
            <CheckCircle2 className="size-3.5" strokeWidth={1.8} aria-hidden />
            Done
          </span>
        ) : required ? (
          <span className="text-xs text-muted-foreground">Required</span>
        ) : null
      }
    >
      {children}
    </WorkspaceFormSection>
  );
}
