const DAY_MS = 24 * 60 * 60 * 1000;

export function cadenceToDayOffsets(
  startDate: string,
  endDate: string,
  perWeek: number,
): number[] {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  const spanDays = Math.max(0, Math.round((end - start) / DAY_MS));
  const weeks = Math.max(1, (spanDays + 1) / 7);
  const count = Math.max(1, Math.round(perWeek * weeks));
  if (spanDays === 0) return [0];
  const offsets: number[] = [];
  for (let i = 0; i < count; i += 1) {
    // even spread across [0, spanDays]
    const off = Math.round((spanDays * i) / Math.max(1, count - 1));
    offsets.push(off);
  }
  return Array.from(new Set(offsets)).sort((a, b) => a - b);
}
