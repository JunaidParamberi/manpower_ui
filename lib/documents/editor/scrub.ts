export type NumberBounds = { min: number; max: number; step: number };
export const SCRUB_PX_PER_STEP = 6;

const tidy = (n: number) => +n.toFixed(4);

export function clampValue(value: number, b: NumberBounds): number {
  return Math.min(b.max, Math.max(b.min, value));
}

export function scrubValue(start: number, dx: number, b: NumberBounds, shift: boolean): number {
  const steps = Math.trunc(dx / SCRUB_PX_PER_STEP);
  return clampValue(tidy(start + steps * b.step * (shift ? 10 : 1)), b);
}

export function stepValue(value: number, direction: 1 | -1, b: NumberBounds, shift: boolean): number {
  return clampValue(tidy(value + direction * b.step * (shift ? 10 : 1)), b);
}

export function parseNumberInput(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
