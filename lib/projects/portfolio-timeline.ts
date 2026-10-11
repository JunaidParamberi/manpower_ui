import { daysFrom } from "@/lib/projects/project-pace";

export type TimelineZoom = 3 | 6 | 12;
export type TimelineMonth = { key: string; label: string; startFrac: number; widthFrac: number; isCurrent: boolean };
export type TimelineWindow = { start: string; end: string; totalDays: number; months: TimelineMonth[] };

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function parseZoom(v: string | null | undefined): TimelineZoom {
  return v === "3" ? 3 : v === "12" ? 12 : 6;
}

function monthStart(year: number, monthIndex: number): string {
  const d = new Date(Date.UTC(year, monthIndex, 1));
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Window opens on the 1st of a month: at least `floor(zoom / 3)` months before
 * today, earlier when `earliest` (the earliest project start) needs it, but
 * never more than `zoom - 1` months back so today stays in view.
 */
export function timelineWindow(today: string, zoom: TimelineZoom, earliest?: string | null): TimelineWindow {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7)) - 1;
  const latestStart = m - Math.floor(zoom / 3);
  const earliestStart = m - (zoom - 1);
  const wanted = earliest
    ? (Number(earliest.slice(0, 4)) - y) * 12 + Number(earliest.slice(5, 7)) - 1
    : latestStart;
  const firstMonth = Math.max(earliestStart, Math.min(latestStart, wanted));
  const start = monthStart(y, firstMonth);
  const end = monthStart(y, firstMonth + zoom);
  const totalDays = daysFrom(start, end);
  const months: TimelineMonth[] = [];
  for (let i = 0; i < zoom; i++) {
    const s = monthStart(y, firstMonth + i);
    const e = monthStart(y, firstMonth + i + 1);
    const idx = new Date(`${s}T00:00:00Z`).getUTCMonth();
    months.push({
      key: s,
      label: MONTH_LABELS[idx],
      startFrac: daysFrom(start, s) / totalDays,
      widthFrac: daysFrom(s, e) / totalDays,
      isCurrent: today >= s && today < e,
    });
  }
  return { start, end, totalDays, months };
}

export function fracOf(win: TimelineWindow, iso: string): number {
  return daysFrom(win.start, iso) / win.totalDays;
}

export type BarGeometry = { left: number; width: number; clippedStart: boolean; clippedEnd: boolean; visible: boolean };

export function barGeometry(win: TimelineWindow, start: string, end: string): BarGeometry {
  // The deadline day itself is part of the bar, so a same-day project is one day wide.
  const a = fracOf(win, start);
  const b = fracOf(win, addDays(end, 1));
  const left = Math.min(1, Math.max(0, a));
  const right = Math.min(1, Math.max(0, b));
  const visible = b > 0 && a < 1 && right > left;
  return { left, width: visible ? right - left : 0, clippedStart: a < 0, clippedEnd: b > 1, visible };
}

export type DragEdge = "move" | "start" | "end";

export function shiftDates(start: string, end: string, dayDelta: number, edge: DragEdge): { start: string; end: string } {
  if (edge === "move") return { start: addDays(start, dayDelta), end: addDays(end, dayDelta) };
  if (edge === "start") {
    const next = addDays(start, dayDelta);
    return { start: next > end ? end : next, end };
  }
  const next = addDays(end, dayDelta);
  return { start, end: next < start ? start : next };
}

export function pxToDays(px: number, laneWidthPx: number, totalDays: number): number {
  if (laneWidthPx <= 0) return 0;
  return Math.round((px / laneWidthPx) * totalDays);
}
