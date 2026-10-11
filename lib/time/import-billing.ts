export type CompletedEntry = {
  id: string;
  started_at: string;
  duration_seconds: number;
};

export type DayGroup = {
  date: string;
  totalSeconds: number;
  entryIds: string[];
};

export function groupEntriesByDay(entries: CompletedEntry[]): DayGroup[] {
  const map = new Map<string, { totalSeconds: number; entryIds: string[] }>();

  for (const entry of entries) {
    const date = entry.started_at.slice(0, 10);
    const existing = map.get(date);
    if (existing) {
      existing.totalSeconds += entry.duration_seconds;
      existing.entryIds.push(entry.id);
    } else {
      map.set(date, {
        totalSeconds: entry.duration_seconds,
        entryIds: [entry.id],
      });
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { totalSeconds, entryIds }]) => ({
      date,
      totalSeconds,
      entryIds,
    }));
}
