"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ClientTile } from "@/components/features/projects/client-tile";
import type { PacedProject } from "@/lib/projects/portfolio-filters";
import {
  addDays,
  barGeometry,
  fracOf,
  pxToDays,
  shiftDates,
  timelineWindow,
  type DragEdge,
  type TimelineZoom,
} from "@/lib/projects/portfolio-timeline";
import { cn } from "@/lib/utils";

type Props = {
  projects: PacedProject[];
  today: string;
  zoom: TimelineZoom;
  onZoom: (zoom: TimelineZoom) => void;
  onOpen: (id: string) => void;
  onReschedule: (id: string, dates: { start_date: string; deadline: string }) => void;
};

type Drag = { id: string; edge: DragEdge; startX: number; dx: number; start: string; end: string };

const ZOOMS: TimelineZoom[] = [3, 6, 12];
const EDGE_PX = 6;
const CLICK_PX = 4;

/**
 * Start of a project's bar: its start date, else when it was created. If that
 * is on or after the deadline (back-dated deadline), show two weeks ending at
 * the deadline so the bar is still visible.
 */
function naturalStart(p: PacedProject): string {
  const start = p.start_date ?? p.created_at.slice(0, 10);
  if (p.deadline && start >= p.deadline) return addDays(p.deadline, -14);
  return start;
}

function barTone(p: PacedProject): string {
  if (p.status === "planning") {
    return "border border-dashed border-[var(--border-strong)] bg-[repeating-linear-gradient(135deg,transparent_0_6px,color-mix(in_srgb,var(--chart-2)_14%,transparent)_6px_8px)]";
  }
  if (p.pace.kind === "late") return "bg-[var(--danger-soft)] ring-1 ring-inset ring-[var(--danger)]/35";
  if (p.status === "on_hold") return "bg-[var(--bg-subtle)] ring-1 ring-inset ring-[var(--border-strong)]";
  if (p.status === "completed") return "bg-[var(--success-soft)] ring-1 ring-inset ring-[var(--success)]/30";
  return "bg-[var(--accent-soft)] ring-1 ring-inset ring-[var(--accent)]/30";
}

function fillTone(p: PacedProject): string {
  if (p.pace.kind === "late") return "bg-[var(--danger)]/25";
  if (p.status === "on_hold") return "bg-[var(--fg-3)]/20";
  if (p.status === "completed") return "bg-[var(--success)]/25";
  return "bg-[var(--accent)]/25";
}

/**
 * Every project as a bar across months: fill is work done, red is late,
 * hatched is planned. Drag to move a project, drag an end to change one date.
 */
export function ProjectsTimelineView({ projects, today, zoom, onZoom, onOpen, onReschedule }: Props) {
  const earliest = useMemo(
    () =>
      projects
        .filter((p) => p.deadline !== null)
        .map((p) => naturalStart(p))
        .sort()[0] ?? null,
    [projects],
  );
  const win = useMemo(() => timelineWindow(today, zoom, earliest), [today, zoom, earliest]);
  const laneRef = useRef<HTMLDivElement>(null);
  const [drag, setDragState] = useState<Drag | null>(null);
  // Mirror for the window listeners: side effects (open / reschedule) must
  // not run inside a state updater, which Strict Mode calls twice.
  const dragRef = useRef<Drag | null>(null);
  const setDrag = (next: Drag | null) => {
    dragRef.current = next;
    setDragState(next);
  };

  // Alt+arrow nudges: move the bar right away, save once the keys go quiet.
  const [nudge, setNudge] = useState<{ id: string; start: string; end: string; days: number } | null>(null);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
  }, []);

  const dated = projects.filter((p) => p.deadline !== null);
  const undated = projects.filter((p) => p.deadline === null);
  const todayFrac = fracOf(win, today);

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (d) setDrag({ ...d, dx: e.clientX - d.startX });
    };
    const up = () => {
      const d = dragRef.current;
      setDrag(null);
      if (!d) return;
      if (Math.abs(d.dx) < CLICK_PX) {
        onOpen(d.id);
        return;
      }
      const days = pxToDays(d.dx, laneRef.current?.getBoundingClientRect().width ?? 0, win.totalDays);
      if (days !== 0) {
        const next = shiftDates(d.start, d.end, days, d.edge);
        onReschedule(d.id, { start_date: next.start, deadline: next.end });
      }
    };
    // A cancelled pointer (touch scroll took over) must never commit.
    const cancel = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    window.addEventListener("pointercancel", cancel, { once: true });
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
    // The handlers only need to rebind when a drag starts or ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id]);

  function datesFor(p: PacedProject): { start: string; end: string } {
    const start = naturalStart(p);
    const end = p.deadline ?? start;
    if (nudge && nudge.id === p.id) return shiftDates(nudge.start, nudge.end, nudge.days, "move");
    if (drag && drag.id === p.id) {
      const days = pxToDays(drag.dx, laneRef.current?.getBoundingClientRect().width ?? 0, win.totalDays);
      return shiftDates(drag.start, drag.end, days, drag.edge);
    }
    return { start, end };
  }

  function startDrag(e: React.PointerEvent<HTMLButtonElement>, p: PacedProject) {
    if (e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const edge: DragEdge = x <= EDGE_PX ? "start" : x >= rect.width - EDGE_PX ? "end" : "move";
    const { start, end } = datesFor(p);
    setDrag({ id: p.id, edge, startX: e.clientX, dx: 0, start, end });
  }

  function onBarKey(e: React.KeyboardEvent<HTMLButtonElement>, p: PacedProject) {
    if (e.key === "Enter") {
      onOpen(p.id);
      return;
    }
    if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const step = e.key === "ArrowLeft" ? -1 : 1;
      const base =
        nudge && nudge.id === p.id
          ? nudge
          : { id: p.id, start: p.start_date ?? p.created_at.slice(0, 10), end: p.deadline ?? p.created_at.slice(0, 10), days: 0 };
      const next = { ...base, days: base.days + step };
      setNudge(next);
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
      nudgeTimer.current = setTimeout(() => {
        setNudge(null);
        if (next.days !== 0) {
          const moved = shiftDates(next.start, next.end, next.days, "move");
          onReschedule(next.id, { start_date: moved.start, deadline: moved.end });
        }
      }, 600);
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className={cn("relative min-w-[960px]", drag && "cursor-grabbing select-none")}>
        {/* Header */}
        <div className="sticky top-0 z-20 grid h-[38px] grid-cols-[248px_minmax(0,1fr)] border-b border-border bg-[var(--panel)]">
          <div className="flex items-center justify-between gap-2 ps-7 pe-3">
            <span className="text-meta text-[var(--fg-3)]">
              {projects.length} project{projects.length === 1 ? "" : "s"}
            </span>
            <div role="group" aria-label="Zoom" className="flex gap-0.5 rounded-md bg-[var(--bg-subtle)] p-0.5">
              {ZOOMS.map((z) => (
                <button
                  key={z}
                  type="button"
                  aria-pressed={zoom === z}
                  onClick={() => onZoom(z)}
                  className={cn(
                    "h-5 rounded-[5px] border-0 px-1.5 text-label font-medium",
                    zoom === z ? "bg-card text-foreground shadow-[var(--shadow-xs)]" : "bg-transparent text-[var(--fg-3)] hover:text-foreground",
                  )}
                >
                  {z}M
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            {win.months.map((m) => (
              <span
                key={m.key}
                className={cn(
                  "absolute inset-y-0 flex items-start border-s border-border ps-2 pt-[7px] text-meta",
                  m.isCurrent ? "font-medium text-foreground" : "text-[var(--fg-2)]",
                )}
                // Geometry is data.
                style={{ left: `${m.startFrac * 100}%`, width: `${m.widthFrac * 100}%` }}
              >
                {m.label}
              </span>
            ))}
            {todayFrac >= 0 && todayFrac <= 1 ? (
              <span
                title="Today"
                aria-label="Today"
                className="absolute bottom-0 z-10 size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-[var(--danger)] ring-2 ring-[var(--panel)]"
                // Position is data.
                style={{ left: `${todayFrac * 100}%` }}
              />
            ) : null}
          </div>
        </div>

        {/* Rows */}
        {dated.map((p, index) => {
          const { start, end } = datesFor(p);
          const g = barGeometry(win, start, end);
          return (
            <div key={p.id} className="grid h-12 grid-cols-[248px_minmax(0,1fr)] border-b border-border hover:bg-[var(--bg-subtle)]/50">
              <button
                type="button"
                onClick={() => onOpen(p.id)}
                className="flex min-w-0 flex-col items-start justify-center border-0 bg-transparent ps-7 pe-4 text-start"
              >
                <span className="max-w-full truncate text-body font-medium">{p.title}</span>
                <ClientTile name={p.client?.name ?? null} />
              </button>
              <div ref={index === 0 ? laneRef : undefined} className="relative">
                {win.months.map((m) => (
                  <span
                    key={m.key}
                    aria-hidden
                    className="absolute inset-y-0 w-px bg-border"
                    // Geometry is data.
                    style={{ left: `${m.startFrac * 100}%` }}
                  />
                ))}
                {g.visible ? (
                  <button
                    type="button"
                    aria-label={`${p.title}: ${p.pace.label}. Enter to open, Alt and arrow keys to move by a day.`}
                    onPointerDown={(e) => startDrag(e, p)}
                    onKeyDown={(e) => onBarKey(e, p)}
                    className={cn(
                      "group absolute top-[13px] flex h-[22px] min-w-3 cursor-grab touch-none items-center overflow-hidden rounded-md p-0 text-start",
                      barTone(p),
                      g.clippedStart && "rounded-s-none",
                      g.clippedEnd && "rounded-e-none",
                      drag?.id === p.id && "shadow-[var(--shadow-md)]",
                    )}
                    // Geometry is data.
                    style={{ left: `${g.left * 100}%`, width: `${g.width * 100}%` }}
                  >
                    <span
                      aria-hidden
                      className={cn("absolute inset-y-0 start-0", fillTone(p))}
                      // Width is data.
                      style={{ width: `${Math.round(p.pace.workDone * 100)}%` }}
                    />
                    <span aria-hidden className="absolute inset-y-0 start-0 w-1.5 cursor-ew-resize" />
                    <span aria-hidden className="absolute inset-y-0 end-0 w-1.5 cursor-ew-resize" />
                    <span className="relative truncate px-2 text-meta font-medium text-foreground">{p.title}</span>
                  </button>
                ) : null}
                {p.milestones
                  .filter((m) => m.dueDate !== null)
                  .map((m) => {
                    const f = fracOf(win, m.dueDate as string);
                    if (f < 0 || f > 1) return null;
                    return (
                      <span
                        key={m.id}
                        title={m.title}
                        className="pointer-events-none absolute top-5 z-[1] size-2 -translate-x-1/2 rotate-45 rounded-[1px] bg-card ring-[1.5px] ring-[var(--fg-2)]"
                        // Position is data.
                        style={{ left: `${f * 100}%` }}
                      />
                    );
                  })}
              </div>
            </div>
          );
        })}

        {undated.length > 0 ? (
          <>
            <div className="px-7 pt-4 pb-1.5 text-meta font-medium text-[var(--fg-2)]">No dates</div>
            {undated.map((p) => (
              <div key={p.id} className="grid h-11 grid-cols-[248px_minmax(0,1fr)] border-b border-border">
                <button
                  type="button"
                  onClick={() => onOpen(p.id)}
                  className="flex min-w-0 flex-col justify-center border-0 bg-transparent ps-7 pe-4 text-start"
                >
                  <span className="truncate text-body font-medium">{p.title}</span>
                  <ClientTile name={p.client?.name ?? null} />
                </button>
                <div className="flex items-center ps-3">
                  <Link href={`/projects/${p.id}`} className="text-meta text-[var(--accent)] underline-offset-4 hover:underline">
                    Set dates
                  </Link>
                </div>
              </div>
            ))}
          </>
        ) : null}

        {dated.length === 0 && undated.length === 0 ? (
          <p className="px-7 py-10 text-body text-[var(--fg-3)]">No projects to place on the timeline.</p>
        ) : null}

        {/* Today line over the lanes */}
        {todayFrac >= 0 && todayFrac <= 1 && dated.length > 0 ? (
          <div aria-hidden className="pointer-events-none absolute top-[38px] right-0 bottom-0 left-[248px]">
            <span
              className="absolute inset-y-0 z-10 w-[1.5px] bg-[var(--danger)]"
              // Position is data.
              style={{ left: `${todayFrac * 100}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
