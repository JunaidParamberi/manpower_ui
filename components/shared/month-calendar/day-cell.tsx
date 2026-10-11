"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DayCellProps = {
  /** YYYY-MM-DD — identity for drops and for the add-button label. */
  iso: string;
  /** Day-of-month label, e.g. "15". */
  dateNumber: string;
  /** False for month-grid spill days from the neighbouring month. */
  inMonth?: boolean;
  isToday?: boolean;
  /** Pre-rendered, pre-keyed event nodes in display order. */
  events: ReactNode[];
  /**
   * Optional text beside the date badge (WeekCalendar uses it for the weekday
   * name). Kept out of `events` on purpose: `events` is what the maxEvents cap
   * slices, and a label counted against that cap could be pushed into the
   * "+N more" popover.
   */
  label?: ReactNode;
  /** Beyond this many, the rest collapse into a "+N more" popover. */
  maxEvents?: number;
  /** "compact" for the month grid, "tall" for the week columns. */
  variant?: "compact" | "tall";
  onAdd?: (iso: string) => void;
  dropRef?: (node: HTMLElement | null) => void;
  isOver?: boolean;
  className?: string;
};

/**
 * One day in a calendar grid: date badge, a hover-revealed add button, a
 * capped list of event nodes, and a "+N more" popover for the overflow.
 *
 * The cell itself is a plain container, not a button. The old implementation
 * made the whole cell `role="button"` and then had to filter keydown events so
 * focused child buttons could still activate natively; an explicit add button
 * removes that class of bug and gives screen readers a real label.
 *
 * Pure: no dnd hooks, safe to mount in Storybook. Use DroppableDayCell inside
 * a DndContext when the cell must accept drops.
 */
export function DayCell({
  iso,
  dateNumber,
  inMonth = true,
  isToday = false,
  events,
  label,
  maxEvents = 3,
  variant = "compact",
  onAdd,
  dropRef,
  isOver = false,
  className,
}: DayCellProps) {
  const visible = events.slice(0, maxEvents);
  const overflow = events.slice(maxEvents);

  return (
    <div
      ref={dropRef}
      data-day={iso}
      className={cn(
        "group/day flex flex-col gap-1 bg-card p-1.5 text-left transition-colors",
        variant === "compact" ? "min-h-28" : "min-h-[24rem]",
        !inMonth && "bg-[var(--bg-subtle)]",
        isOver && "bg-muted ring-2 ring-primary/40 ring-inset",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs",
              inMonth ? "text-foreground" : "text-muted-foreground/50",
              isToday && "bg-primary font-medium text-primary-foreground",
            )}
          >
            {dateNumber}
          </span>
          {label ? (
            <span className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
          ) : null}
        </span>
        {onAdd ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-5 text-muted-foreground opacity-0 transition-opacity group-hover/day:opacity-100 focus-visible:opacity-100"
            aria-label={`Add post on ${iso}`}
            onClick={() => onAdd(iso)}
          >
            <Plus className="size-3" aria-hidden />
          </Button>
        ) : null}
      </div>

      {visible.length > 0 ? (
        <div className="flex w-full min-w-0 flex-col gap-1">{visible}</div>
      ) : null}

      {overflow.length > 0 ? (
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="w-full rounded-sm px-1 py-0.5 text-start text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            }
          >
            +{overflow.length} more
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="flex w-64 flex-col gap-1 p-2"
          >
            {overflow}
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}

/** DayCell wired as a drop target. Must be rendered inside a DndContext. */
export function DroppableDayCell(
  props: Omit<DayCellProps, "dropRef" | "isOver">,
) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${props.iso}` });
  return <DayCell {...props} dropRef={setNodeRef} isOver={isOver} />;
}
