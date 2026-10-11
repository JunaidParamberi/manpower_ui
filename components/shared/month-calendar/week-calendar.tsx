"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  DayCell,
  DroppableDayCell,
  type DayCellProps,
} from "@/components/shared/month-calendar/day-cell";
import { useDayBuckets } from "@/components/shared/month-calendar/use-day-buckets";
import { Skeleton } from "@/components/shared/skeletons";
import { buildWeekGrid } from "@/lib/marketing/calendar-utils";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type WeekCalendarProps<E> = {
  /** Monday of the week to render, YYYY-MM-DD. */
  weekAnchor: string;
  events: E[];
  eventId: (event: E) => string;
  eventDate: (event: E) => Date | string | null;
  renderEvent: (event: E) => ReactNode;
  maxEventsPerDay?: number;
  onDayAdd?: (iso: string) => void;
  droppable?: boolean;
  isLoading?: boolean;
};

/**
 * Seven full-height day columns for one Monday-anchored week.
 *
 * Deliberately has no hour-of-day axis. Social posts cluster at a handful of
 * times per day, so a Google-Calendar-style time grid would be mostly empty
 * vertical space; tall columns give each post room for its platform, time, and
 * title instead. Same DayCell as MonthCalendar, just a taller variant and a
 * higher event cap, so the two views cannot drift.
 */
export function WeekCalendar<E>({
  weekAnchor,
  events,
  eventId,
  eventDate,
  renderEvent,
  maxEventsPerDay = 10,
  onDayAdd,
  droppable = false,
  isLoading = false,
}: WeekCalendarProps<E>) {
  // Same hydration guard as MonthCalendar: no cell is "today" until the client
  // has resolved its own local date, so SSR and CSR never disagree.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    setToday(new Date());
  }, []);

  const grid = buildWeekGrid(weekAnchor, today);
  const eventsByDay = useDayBuckets(events, eventDate);

  const Cell: (props: Omit<DayCellProps, "dropRef" | "isOver">) => ReactNode =
    droppable ? DroppableDayCell : DayCell;

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-7">
      {grid.map((cell, index) => (
        <div
          key={`head-${cell.iso}`}
          className={cn(
            "sticky top-0 z-10 hidden bg-muted px-2 py-1.5 text-center text-xs font-medium text-muted-foreground sm:block",
            cell.isToday && "text-foreground",
          )}
        >
          {WEEKDAY_LABELS[index]} {cell.date}
        </div>
      ))}

      {isLoading
        ? Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-[24rem] flex-col gap-1.5 bg-card p-1.5 sm:min-h-[26rem]"
            >
              <Skeleton w={18} h={12} r={3} />
              <Skeleton w="80%" h={10} r={3} />
              <Skeleton w="60%" h={10} r={3} />
            </div>
          ))
        : grid.map((cell, index) => (
            <Cell
              key={cell.iso}
              iso={cell.iso}
              dateNumber={cell.date}
              // On narrow screens the weekday header row is hidden and the
              // columns stack, so each cell names its own weekday. Passed as
              // `label`, not as an event, so it never counts against maxEvents.
              label={
                <span className="sm:hidden">{WEEKDAY_LABELS[index]}</span>
              }
              isToday={cell.isToday}
              maxEvents={maxEventsPerDay}
              variant="tall"
              onAdd={onDayAdd}
              className="sm:min-h-[26rem]"
              events={(eventsByDay[cell.iso] ?? []).map((event) => (
                <div key={eventId(event)}>{renderEvent(event)}</div>
              ))}
            />
          ))}
    </div>
  );
}
