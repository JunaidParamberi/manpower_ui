"use client";

import Link from "next/link";
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { Plus } from "lucide-react";

import { ClientTile } from "@/components/features/projects/client-tile";
import { PaceBar, PACE_TEXT } from "@/components/features/projects/pace-bar";
import { PROJECT_STATUS_LABEL, ProjectStatusMark } from "@/components/features/projects/project-status-mark";
import type { PacedProject } from "@/lib/projects/portfolio-filters";
import { formatCurrency, formatShortDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types";

export const BOARD_COLUMNS: ProjectStatus[] = ["planning", "active", "on_hold", "completed"];

function Card({ p, onOpen, onCompleteTask }: { p: PacedProject; onOpen: (id: string) => void; onCompleteTask: (projectId: string, taskId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: p.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-roledescription="Draggable project"
      aria-label={`${p.title}. Enter to open, Space to pick up and move.`}
      onClick={() => onOpen(p.id)}
      onKeyDown={(e) => {
        // Keys from the inner task checkbox are its own.
        if (e.target !== e.currentTarget) return;
        listeners?.onKeyDown?.(e);
        if (e.key === "Enter") onOpen(p.id);
      }}
      className={cn(
        "flex cursor-pointer flex-col gap-2.5 rounded-[10px] border border-border bg-card px-3 pt-2.5 pb-3 shadow-[var(--shadow-xs)] transition-shadow hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]",
        isDragging && "z-10 shadow-[var(--shadow-pop)]",
      )}
      // Drag offset is live pointer state.
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
    >
      <span className="text-body font-medium leading-snug">{p.title}</span>
      <ClientTile name={p.client?.name ?? null} className="-mt-1" />
      <PaceBar pace={p.pace} size="sm" />
      <span className="flex items-center justify-between gap-2 text-meta">
        <span className={cn("font-medium", PACE_TEXT[p.pace.kind])}>{p.pace.label}</span>
        {p.deadline ? <span className="tabular-nums text-[var(--fg-3)]">Due {formatShortDate(p.deadline)}</span> : null}
      </span>
      {p.nextTask ? (
        <span className="flex min-w-0 items-center gap-2 border-t border-border pt-2 text-meta text-[var(--fg-2)]">
          <button
            type="button"
            aria-label={`Complete ${p.nextTask.title}`}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onCompleteTask(p.id, p.nextTask!.id);
            }}
            className="grid size-3.5 shrink-0 cursor-pointer place-items-center rounded-full border-[1.5px] border-[var(--border-strong)] bg-transparent hover:border-[var(--success)]"
          />
          <span className="truncate">{p.nextTask.title}</span>
        </span>
      ) : null}
    </div>
  );
}

function Column({ status, projects, currency, onOpen, onCompleteTask }: { status: ProjectStatus; projects: PacedProject[]; currency: string; onOpen: (id: string) => void; onCompleteTask: (projectId: string, taskId: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const left = projects.reduce((sum, p) => sum + Math.max(0, (p.budget ?? 0) - p.spend), 0);
  return (
    <section
      ref={setNodeRef}
      aria-label={PROJECT_STATUS_LABEL[status]}
      className={cn(
        "flex w-[272px] shrink-0 flex-col gap-1.5 rounded-[var(--surface-radius)] bg-[var(--bg-subtle)]/55 p-1.5 transition-colors",
        isOver && "bg-[var(--accent-soft)]",
      )}
    >
      <header className="flex h-8 items-center gap-1.5 px-3 text-body font-medium">
        <ProjectStatusMark status={status} />
        {PROJECT_STATUS_LABEL[status]}
        <span className="font-normal text-[var(--fg-3)]">{projects.length}</span>
        <span className="flex-1" />
        {left > 0 && status !== "completed" ? <span className="text-meta font-normal text-[var(--fg-3)]">{formatCurrency(left, currency)}</span> : null}
      </header>
      {projects.map((p) => (
        <Card key={p.id} p={p} onOpen={onOpen} onCompleteTask={onCompleteTask} />
      ))}
      <Link
        href="/projects/new"
        className="flex h-8 items-center gap-1.5 rounded-md px-3 text-meta text-[var(--fg-3)] no-underline hover:bg-card hover:text-[var(--fg-2)]"
      >
        <Plus className="size-3.5" />
        Add project
      </Link>
    </section>
  );
}

/** Portfolio Kanban: drag a card to change its status. */
export function ProjectsBoardView({ projects, currency, onOpen, onMove, onCompleteTask }: { projects: PacedProject[]; currency: string; onOpen: (id: string) => void; onMove: (id: string, status: ProjectStatus) => void; onCompleteTask: (projectId: string, taskId: string) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Tab"] } }));
  function onDragEnd(event: DragEndEvent) {
    const to = event.over?.id as ProjectStatus | undefined;
    const id = String(event.active.id);
    const from = projects.find((p) => p.id === id)?.status;
    if (to && from && to !== from) onMove(id, to);
  }
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex min-h-0 flex-1 items-start gap-3 overflow-auto px-4 pt-5 pb-6 sm:px-6 lg:px-7">
        {BOARD_COLUMNS.map((status) => (
          <Column key={status} status={status} projects={projects.filter((p) => p.status === status)} currency={currency} onOpen={onOpen} onCompleteTask={onCompleteTask} />
        ))}
      </div>
    </DndContext>
  );
}
