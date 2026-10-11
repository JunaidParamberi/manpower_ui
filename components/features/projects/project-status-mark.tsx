import type { ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

const MARK: Record<ProjectStatus, string> = {
  planning: "bg-[var(--chart-2)]",
  active: "bg-[var(--info)]",
  on_hold: "bg-[var(--fg-3)]",
  completed: "bg-[var(--success)]",
  archived: "bg-[var(--border-strong)]",
};

/** Status as a small coloured square (+ optional label) — not a pill. */
export function ProjectStatusMark({ status, withLabel = false }: { status: ProjectStatus; withLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-meta text-[var(--fg-2)]">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-[2px]", MARK[status])} />
      {withLabel ? PROJECT_STATUS_LABEL[status] : <span className="sr-only">{PROJECT_STATUS_LABEL[status]}</span>}
    </span>
  );
}
