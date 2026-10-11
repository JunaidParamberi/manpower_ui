"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  DayCell,
  DroppableDayCell,
  type DayCellProps,
} from "@/components/shared/month-calendar/day-cell";
import { useDayBuckets } from "@/components/shared/month-calendar/use-day-buckets";
import { Skeleton } from "@/components/shared/skeletons";
import { buildMonthGrid } from "@/lib/marketing/calendar-utils";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type MonthCalendarProps<E> = {
  year: number;
  month0: number;
  events: E[];
  /** Stable id per event — used for React keys and dnd identity. */
  eventId: (event: E) => string;
  eventDate: (event: E) => Date | string | null;
  renderEvent: (event: E) => ReactNode;
  maxEventsPerDay?: number;
  onDayAdd?: (iso: string) => void;
  /** Wire day cells as dnd-kit drop targets. Requires an ancestor DndContext. */
  droppable?: boolean;
  isLoading?: boolean;
};

/**
 * Generic, presentation-only month grid of events with zero domain knowledge.
 *
 * Renders a 6×7 Monday-first grid via buildMonthGrid and delegates each day to
 * DayCell. It owns no period state and renders no month navigation — the host
 * page owns the period (in the URL, for /marketing) and renders its own nav,
 * so the calendar never competes with the page header for the same row.
 */
export function MonthCalendar<E>({
  year,
  month0,
  events,
  eventId,
  eventDate,
  renderEvent,
  maxEventsPerDay = 3,
  onDayAdd,
  droppable = false,
  isLoading = false,
}: MonthCalendarProps<E>) {
  // `today` starts null so the server render (which sees the server's own
  // local time, e.g. UTC on Vercel) and the client's pre-hydration render
  // agree: no day is highlighted as "today". Once mounted, this resolves to
  // the browser's actual local date, so the "today" ring appears (or moves to
  // the correct cell) one frame after hydration instead of ever disagreeing
  // with the server-rendered HTML.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    setToday(new Date());
  }, []);

  const grid = buildMonthGrid(year, month0, today);
  const eventsByDay = useDayBuckets(events, eventDate);

  // Chosen per cell, not once for the grid: the 6×7 grid always carries 5-11
  // adjacent-month days, and making those droppable silently loses the post.
  // The drop would succeed, but the next refresh returns a period that excludes
  // the new date, so the chip vanishes with no toast. Out-of-month cells still
  // render their posts — they just accept no drops. Rescheduling into another
  // month is done by navigating to it.
  type CellComponent = (
    props: Omit<DayCellProps, "dropRef" | "isOver">,
  ) => ReactNode;

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
      {WEEKDAY_LABELS.map((label) => (
        <div
          key={label}
          className="sticky top-0 z-10 bg-muted px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
        >
          {label}
        </div>
      ))}

      {isLoading
        ? Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="flex min-h-28 flex-col gap-1.5 bg-card p-1.5">
              <Skeleton w={18} h={12} r={3} />
              <Skeleton w="80%" h={10} r={3} />
            </div>
          ))
        : grid.map((cell) => {
            const Cell: CellComponent =
              droppable && cell.inMonth ? DroppableDayCell : DayCell;
            return (
              <Cell
                key={cell.iso}
                iso={cell.iso}
                dateNumber={cell.date}
                inMonth={cell.inMonth}
                isToday={cell.isToday}
                maxEvents={maxEventsPerDay}
                variant="compact"
                onAdd={onDayAdd}
                events={(eventsByDay[cell.iso] ?? []).map((event) => (
                  <div key={eventId(event)}>{renderEvent(event)}</div>
                ))}
              />
            );
          })}
    </div>
  );
}
