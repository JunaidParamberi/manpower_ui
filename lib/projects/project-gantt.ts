import type { TaskRow, TaskStatus } from "@/types";

export type GanttBar = {
  taskId: string;
  title: string;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
};

type GanttTaskInput = Pick<
  TaskRow,
  "id" | "title" | "status" | "start_date" | "due_date" | "parent_task_id"
>;

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Builds Gantt bars for top-level, dated tasks only.
 * Tasks with no due_date, or with a parent_task_id, are excluded.
 * When start_date is missing, the bar becomes a 1-day span ending on due_date.
 */
export function computeGanttBars(tasks: GanttTaskInput[]): GanttBar[] {
  const bars: GanttBar[] = [];
  for (const task of tasks) {
    if (task.parent_task_id !== null) continue;
    if (task.due_date === null) continue;

    const startDate = task.start_date ?? addDays(task.due_date, -1);

    bars.push({
      taskId: task.id,
      title: task.title,
      status: task.status,
      startDate,
      dueDate: task.due_date,
    });
  }
  return bars;
}

/**
 * Shifts a bar's start and due date by dayDelta, preserving duration.
 */
export function shiftBarDates(
  startDate: string,
  dueDate: string,
  dayDelta: number,
): { start_date: string; due_date: string } {
  return {
    start_date: addDays(startDate, dayDelta),
    due_date: addDays(dueDate, dayDelta),
  };
}

/**
 * Computes the padded date range spanning every bar's start through due date.
 * Returns null when there are no bars.
 */
export function dateRangeSpan(
  bars: Pick<GanttBar, "startDate" | "dueDate">[],
  paddingDays: number,
): { rangeStart: string; rangeEnd: string } | null {
  if (bars.length === 0) return null;

  let earliest = bars[0].startDate;
  let latest = bars[0].dueDate;
  for (const bar of bars) {
    if (bar.startDate < earliest) earliest = bar.startDate;
    if (bar.dueDate > latest) latest = bar.dueDate;
  }

  return {
    rangeStart: addDays(earliest, -paddingDays),
    rangeEnd: addDays(latest, paddingDays),
  };
}

export const GANTT_DAY_WIDTH_PX = 32;

/** Signed day count from fromDate to toDate (positive when toDate is later). */
export function daysBetween(fromDate: string, toDate: string): number {
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const [ty, tm, td] = toDate.split("-").map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / (24 * 60 * 60 * 1000));
}

/** Pixel offset of `date` from `rangeStart`, in whole day-columns. */
export function dayOffsetPx(rangeStart: string, date: string): number {
  return daysBetween(rangeStart, date) * GANTT_DAY_WIDTH_PX;
}

/** Rounds a raw drag pixel delta to a whole day-column delta. */
export function pxDeltaToDayDelta(pxDelta: number): number {
  return Math.sign(pxDelta) * Math.round(Math.abs(pxDelta) / GANTT_DAY_WIDTH_PX);
}

/** Enumerates every ISO date from rangeStart through rangeEnd, inclusive. */
export function enumerateDays(rangeStart: string, rangeEnd: string): string[] {
  const total = daysBetween(rangeStart, rangeEnd);
  if (total < 0) return [];
  const days: string[] = [];
  for (let i = 0; i <= total; i++) {
    days.push(addDays(rangeStart, i));
  }
  return days;
}
