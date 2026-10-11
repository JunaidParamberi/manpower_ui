import { addDaysIso } from "@/lib/documents/draft-defaults";

export const TERM_CHOICES = [0, 7, 15, 30, 60] as const;

/** 42 ISO days (6 weeks) starting on the Monday on or before the 1st. */
export function monthGrid(year: number, month0: number): string[] {
  const first = new Date(Date.UTC(year, month0, 1));
  const offset = (first.getUTCDay() + 6) % 7; // Monday = 0
  const start = addDaysIso(first.toISOString().slice(0, 10), -offset);
  return Array.from({ length: 42 }, (_, i) => addDaysIso(start, i));
}

export function relativeDays(iso: string, todayIso: string): string {
  const diff = Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${todayIso}T00:00:00Z`)) / 86_400_000);
  if (diff === 0) return "today";
  return diff > 0 ? `in ${diff}d` : `${-diff}d ago`;
}
