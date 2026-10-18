"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteWorkerButton } from "@/components/features/workers/delete-worker-button";
import { WORKER_STATUS_LABELS } from "@/lib/validations/worker";
import { cn } from "@/lib/utils";
import {
  WORKER_GROUPS,
  nextExpiry,
  workerGroupOf,
  workerMonogram,
} from "@/lib/workers/worker-readiness";
import type { WorkerListRow } from "@/types";

const STATUS_DOT: Record<string, string> = {
  deployed: "var(--primary)",
  available: "var(--success)",
  on_leave: "var(--warning)",
  inactive: "var(--fg-3)",
};

function workerMeta(worker: WorkerListRow): string {
  return (
    [worker.trade_category, worker.supplier?.name].filter(Boolean).join(" · ") ||
    worker.employee_id ||
    ""
  );
}

type WorkersListCardProps = {
  workers: WorkerListRow[];
  selectedId: string | null;
  /** Group rows under sticky headings (All lens, no search). */
  groups: boolean;
  nowIso: string;
  onClearFilters: () => void;
  onSelect: (workerId: string) => void;
};

type WorkerRowProps = {
  worker: WorkerListRow;
  selected: boolean;
  nowIso: string;
  onSelect: (workerId: string) => void;
  onEdit: (workerId: string) => void;
  onDelete: (worker: WorkerListRow) => void;
};

function WorkerRow({ worker, selected, nowIso, onSelect, onEdit, onDelete }: WorkerRowProps) {
  const expiry = nextExpiry(worker, nowIso);
  const expired = expiry !== null && expiry.daysLeft < 0;
  const soon = expiry !== null && expiry.daysLeft >= 0 && expiry.daysLeft <= 30;

  return (
    <li
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      className={cn(
        "flex cursor-pointer items-center gap-3 border-l-2 py-2.5 ps-[14px] pe-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:ps-[22px] sm:pe-5 lg:ps-[26px]",
        selected ? "border-l-primary bg-[var(--bg-subtle)]" : "border-l-transparent hover:bg-[var(--bg-subtle)]",
      )}
      onClick={() => onSelect(worker.id)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
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
        <div className="truncate text-body font-medium text-foreground">{worker.name}</div>
        <div className="truncate text-meta text-[var(--fg-3)]">{workerMeta(worker) || "No details yet"}</div>
      </div>
      <div className="shrink-0 text-right">
        {expired ? (
          <div className="text-label font-medium text-[var(--danger)]">{expiry.label} expired</div>
        ) : soon ? (
          <div className="text-label font-medium tabular-nums text-[var(--warning)]">
            {expiry.label} · {expiry.daysLeft}d
          </div>
        ) : null}
        <div className="inline-flex items-center gap-[5px] text-meta text-[var(--fg-2)]">
          <span
            aria-hidden
            className="inline-block size-[7px] rounded-full"
            style={{ backgroundColor: STATUS_DOT[worker.status] ?? "var(--fg-3)" }}
          />
          {WORKER_STATUS_LABELS[worker.status]}
        </div>
      </div>
      <div
        className="shrink-0"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${worker.name}`}>
                <MoreVertical />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onSelect(worker.id)}>Open</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(worker.id)}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(worker)}>
              <Trash2 data-icon="inline-start" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

export function WorkersListCard({
  workers,
  selectedId,
  groups,
  nowIso,
  onClearFilters,
  onSelect,
}: WorkersListCardProps) {
  const router = useRouter();
  const [pendingDelete, setPendingDelete] = useState<WorkerListRow | null>(null);

  if (workers.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 px-4 py-6 sm:px-6 lg:px-7">
        <p className="text-body text-[var(--fg-3)]">No workers match.</p>
        <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>
    );
  }

  const renderRow = (worker: WorkerListRow) => (
    <WorkerRow
      key={worker.id}
      worker={worker}
      selected={worker.id === selectedId}
      nowIso={nowIso}
      onSelect={onSelect}
      onEdit={(workerId) => router.push(`/workers/${workerId}/edit`)}
      onDelete={setPendingDelete}
    />
  );

  const deleteDialog = pendingDelete ? (
    <DeleteWorkerButton
      key={pendingDelete.id}
      workerId={pendingDelete.id}
      workerName={pendingDelete.name}
      open
      onOpenChange={(open) => {
        if (!open) setPendingDelete(null);
      }}
      hideTrigger
    />
  ) : null;

  if (groups) {
    return (
      <>
        {WORKER_GROUPS.map((group) => {
          const rows = workers.filter((w) => workerGroupOf(w, nowIso) === group.id);
          if (rows.length === 0) return null;
          return (
            <section key={group.id} aria-label={group.label}>
              <h2 className="sticky top-0 z-10 bg-[var(--panel)] px-4 pt-3.5 pb-1.5 text-label font-medium uppercase tracking-[0.04em] text-[var(--fg-3)] sm:px-6 lg:px-7">
                {group.label}
              </h2>
              <ul role="list">{rows.map(renderRow)}</ul>
            </section>
          );
        })}
        {deleteDialog}
      </>
    );
  }

  return (
    <>
      <ul role="list" className="pt-1.5">
        {workers.map(renderRow)}
      </ul>
      {deleteDialog}
    </>
  );
}
