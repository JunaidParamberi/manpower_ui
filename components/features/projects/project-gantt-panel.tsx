"use client";

import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CalendarRange } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type CSSProperties } from "react";
import { toast } from "sonner";

import { updateTask } from "@/lib/tasks/actions";
import {
  GANTT_DAY_WIDTH_PX,
  computeGanttBars,
  dateRangeSpan,
  dayOffsetPx,
  daysBetween,
  enumerateDays,
  pxDeltaToDayDelta,
  shiftBarDates,
  type GanttBar,
} from "@/lib/projects/project-gantt";
import type { ProjectMilestoneRow, TaskRow } from "@/types";

import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProjectGanttPanelProps = {
  projectId: string;
  tasks: TaskRow[];
  milestones: ProjectMilestoneRow[];
};

const RANGE_PADDING_DAYS = 3;
const ROW_HEIGHT_PX = 44;

function formatShort(date: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

export function ProjectGanttPanel({
  projectId,
  tasks,
  milestones,
}: ProjectGanttPanelProps) {
  const router = useRouter();
  const [barsByTask, setBarsByTask] = useState<Map<string, GanttBar>>(
    () => new Map(computeGanttBars(tasks).map((bar) => [bar.taskId, bar])),
  );
  const [showCompleted, setShowCompleted] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const bars = useMemo(() => {
    const all = Array.from(barsByTask.values());
    const filtered = showCompleted
      ? all
      : all.filter((bar) => bar.status !== "done" && bar.status !== "cancelled");
    return filtered.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [barsByTask, showCompleted]);

  const range = useMemo(
    () => dateRangeSpan(bars, RANGE_PADDING_DAYS),
    [bars],
  );

  const visibleMilestones = useMemo(() => {
    if (!range) return [];
    return milestones.filter(
      (m) =>
        m.due_date !== null &&
        m.due_date >= range.rangeStart &&
        m.due_date <= range.rangeEnd,
    );
  }, [milestones, range]);

  function handleDragEnd(event: DragEndEvent) {
    if (!range) return;
    const taskId = event.active.id as string;
    const bar = barsByTask.get(taskId);
    if (!bar) return;

    const dayDelta = pxDeltaToDayDelta(event.delta.x);
    if (dayDelta === 0) return;

    const shifted = shiftBarDates(bar.startDate, bar.dueDate, dayDelta);
    const previous = bar;

    setBarsByTask((prev) => {
      const next = new Map(prev);
      next.set(taskId, {
        ...bar,
        startDate: shifted.start_date,
        dueDate: shifted.due_date,
      });
      return next;
    });

    startTransition(async () => {
      const result = await updateTask(projectId, taskId, shifted);
      if (!result.ok) {
        setBarsByTask((prev) => {
          const next = new Map(prev);
          next.set(taskId, previous);
          return next;
        });
        toast.error(result.message ?? "Failed to reschedule task.");
        return;
      }
      toast.success("Task rescheduled");
      router.refresh();
    });
  }

  if (bars.length === 0 && !showCompleted) {
    const hasHiddenCompleted = Array.from(barsByTask.values()).length > 0;
    return (
      <div className="flex flex-col gap-3">
        <GanttToolbar showCompleted={showCompleted} onToggle={setShowCompleted} />
        <EmptyStateCard
          icon={CalendarRange}
          title="No dated tasks yet"
          description={
            hasHiddenCompleted
              ? "All dated tasks are done or cancelled. Show completed to see them."
              : "Add a due date to a task to see it on the Gantt chart."
          }
        />
      </div>
    );
  }

  if (!range) {
    return (
      <div className="flex flex-col gap-3">
        <GanttToolbar showCompleted={showCompleted} onToggle={setShowCompleted} />
        <EmptyStateCard
          icon={CalendarRange}
          title="No dated tasks yet"
          description="Add a due date to a task to see it on the Gantt chart."
        />
      </div>
    );
  }

  const totalDays = daysBetween(range.rangeStart, range.rangeEnd) + 1;
  const gridWidth = totalDays * GANTT_DAY_WIDTH_PX;
  const days = enumerateDays(range.rangeStart, range.rangeEnd);

  return (
    <div className="flex flex-col gap-3">
      <GanttToolbar showCompleted={showCompleted} onToggle={setShowCompleted} />
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
        <div style={{ width: gridWidth }}>
          <GanttDateHeader days={days} rangeStart={range.rangeStart} />
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div
              className="relative"
              style={{
                width: gridWidth,
                minHeight: bars.length * ROW_HEIGHT_PX + 16,
              }}
            >
              {days.map((day) => (
                <div
                  key={day}
                  className="absolute top-0 bottom-0 w-px bg-border/50"
                  style={{ left: dayOffsetPx(range.rangeStart, day) }}
                  aria-hidden
                />
              ))}
              {visibleMilestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="group absolute top-0 bottom-0 flex w-2.5 -translate-x-1/2 justify-center"
                  style={{ left: dayOffsetPx(range.rangeStart, milestone.due_date!) }}
                >
                  <div className="h-full w-px bg-primary/40" aria-hidden />
                  <span className="sr-only">{`${milestone.title} — ${formatShort(milestone.due_date!)}`}</span>
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100"
                  >
                    {milestone.title} — {formatShort(milestone.due_date!)}
                  </div>
                </div>
              ))}
              {bars.map((bar, index) => (
                <GanttRow
                  key={bar.taskId}
                  bar={bar}
                  rangeStart={range.rangeStart}
                  top={index * ROW_HEIGHT_PX + 8}
                />
              ))}
            </div>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

const DATE_HEADER_HEIGHT_PX = 24;

function GanttDateHeader({
  days,
  rangeStart,
}: {
  days: string[];
  rangeStart: string;
}) {
  let previousMonth = "";
  return (
    <div
      className="relative border-b border-border bg-muted/30"
      style={{ height: DATE_HEADER_HEIGHT_PX }}
    >
      {days.map((day) => {
        const date = new Date(`${day}T12:00:00.000Z`);
        const dayNumber = date.getUTCDate();
        const month = new Intl.DateTimeFormat("en", { month: "short" }).format(
          date,
        );
        const showMonth = month !== previousMonth;
        previousMonth = month;
        return (
          <div
            key={day}
            className="absolute top-0 flex h-full items-center justify-center text-[10px] text-muted-foreground"
            style={{ left: dayOffsetPx(rangeStart, day), width: GANTT_DAY_WIDTH_PX }}
          >
            {showMonth ? `${month} ${dayNumber}` : dayNumber}
          </div>
        );
      })}
    </div>
  );
}

function GanttToolbar({
  showCompleted,
  onToggle,
}: {
  showCompleted: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-end">
      <Button
        type="button"
        variant={showCompleted ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(!showCompleted)}
      >
        {showCompleted ? "Hide done & cancelled" : "Show done & cancelled"}
      </Button>
    </div>
  );
}

function GanttRow({
  bar,
  rangeStart,
  top,
}: {
  bar: GanttBar;
  rangeStart: string;
  top: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: bar.taskId });

  const left = dayOffsetPx(rangeStart, bar.startDate);
  const width =
    dayOffsetPx(rangeStart, bar.dueDate) - left + GANTT_DAY_WIDTH_PX;

  const style: CSSProperties = {
    left,
    width,
    top,
    height: ROW_HEIGHT_PX - 12,
    transform: transform
      ? `translate3d(${transform.x}px, 0, 0)`
      : undefined,
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      className={cn(
        "absolute flex items-center gap-2 overflow-hidden rounded-lg border border-border bg-[var(--bg-subtle)] px-2.5 text-left text-xs shadow-xs transition-shadow",
        "hover:shadow-md",
        isDragging && "z-10 cursor-grabbing shadow-lg",
        !isDragging && "cursor-grab",
      )}
      style={style}
      title={`${bar.title} — ${formatShort(bar.startDate)} to ${formatShort(bar.dueDate)}`}
    >
      <StatusBadge status={bar.status} dot />
      <span className="min-w-0 truncate font-medium">{bar.title}</span>
    </button>
  );
}
