"use client";

import { Badge } from "@/components/ui/badge";
import { WORKER_STATUS_LABELS } from "@/lib/validations/worker";
import { cn } from "@/lib/utils";
import type { WorkerListRow } from "@/types";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  available: "default",
  deployed: "secondary",
  on_leave: "outline",
  inactive: "destructive",
};

function workerMonogram(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

function workerMeta(worker: WorkerListRow): string {
  return [worker.employee_id, worker.trade_category, worker.supplier?.name]
    .filter(Boolean)
    .join(" · ");
}

type WorkersListCardProps = {
  workers: WorkerListRow[];
  selectedId: string | null;
  onClearFilters: () => void;
  onSelect: (workerId: string) => void;
};

export function WorkersListCard({
  workers,
  selectedId,
  onClearFilters,
  onSelect,
}: WorkersListCardProps) {
  if (workers.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 px-4 py-6 sm:px-6 lg:px-7">
        <p className="text-body text-[var(--fg-3)]">No workers match.</p>
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-[var(--bg-subtle)]"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <ul role="list" className="pt-1.5">
      {workers.map((worker) => {
        const selected = worker.id === selectedId;
        return (
          <li
            key={worker.id}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            className={cn(
              "flex cursor-pointer items-center gap-3 border-l-2 py-2.5 ps-[14px] pe-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:ps-[22px] sm:pe-5 lg:ps-[26px]",
              selected
                ? "border-l-primary bg-[var(--bg-subtle)]"
                : "border-l-transparent hover:bg-[var(--bg-subtle)]",
            )}
            onClick={() => onSelect(worker.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(worker.id);
              }
            }}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[var(--accent-soft)] text-label font-semibold text-primary">
              {workerMonogram(worker.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-body font-medium text-foreground">
                {worker.name}
              </div>
              <div className="truncate text-meta text-[var(--fg-3)]">
                {workerMeta(worker) || "No details yet"}
              </div>
            </div>
            <Badge variant={STATUS_VARIANT[worker.status] ?? "outline"}>
              {WORKER_STATUS_LABELS[worker.status]}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
