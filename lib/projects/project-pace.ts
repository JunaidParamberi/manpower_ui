import type { ProjectStatus } from "@/types";

/**
 * Pace = how a project's work compares with its schedule and budget.
 * Pure: `today` is injected so pages, stories and tests agree.
 */
export const BEHIND_THRESHOLD = 0.12;
export const OVER_BUDGET_THRESHOLD = 0.25;

export type PaceKind =
  | "ahead"
  | "on_pace"
  | "behind"
  | "over_budget"
  | "late"
  | "not_started"
  | "paused"
  | "delivered"
  | "no_dates"
  /** Active, but no tasks to measure work against. */
  | "untracked";

export type PaceInput = {
  status: ProjectStatus;
  startDate: string | null;
  createdAt: string;
  deadline: string | null;
  /** 0..1 */
  workDone: number;
  budget: number | null;
  spent: number;
  /** YYYY-MM-DD */
  today: string;
  /** False when the project has no tasks: work done can't be measured. */
  hasTasks?: boolean;
};

export type Pace = {
  kind: PaceKind;
  label: string;
  detail: string;
  timeElapsed: number | null;
  workDone: number;
  budgetUsed: number | null;
  needsYou: boolean;
};

const DAY_MS = 86_400_000;

function dayStamp(iso: string): number {
  return Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}

/** Whole calendar days from `fromIso` to `toIso` (date part only). */
export function daysFrom(fromIso: string, toIso: string): number {
  return Math.round((dayStamp(toIso) - dayStamp(fromIso)) / DAY_MS);
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
const pct = (n: number) => `${Math.round(n * 100)}%`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function computePace(input: PaceInput): Pace {
  const workDone = clamp01(input.workDone);
  const budgetUsed = input.budget && input.budget > 0 ? Math.max(0, input.spent / input.budget) : null;
  const start = input.startDate ?? input.createdAt.slice(0, 10);
  const timeElapsed =
    input.deadline !== null
      ? (() => {
          const span = daysFrom(start, input.deadline);
          return span <= 0 ? 1 : clamp01(daysFrom(start, input.today) / span);
        })()
      : null;
  const base = { timeElapsed, workDone, budgetUsed };
  const make = (kind: PaceKind, label: string, detail: string): Pace => ({
    kind,
    label,
    detail,
    ...base,
    needsYou: kind === "late" || kind === "behind" || kind === "over_budget",
  });

  if (input.status === "completed") return make("delivered", "Delivered", "Finished");
  if (input.status === "on_hold") return make("paused", "Paused", "On hold");
  if (input.status === "planning") {
    const inDays = input.startDate ? daysFrom(input.today, input.startDate) : 0;
    return make("not_started", "Not started", inDays > 0 ? `Starts in ${plural(inDays, "day")}` : "Planning");
  }
  if (input.deadline === null) return make("no_dates", "No deadline set", `${pct(workDone)} done`);

  const overdueDays = daysFrom(input.deadline, input.today);
  if (overdueDays > 0 && workDone < 1) {
    return make("late", `${plural(overdueDays, "day")} late`, `${pct(workDone)} done`);
  }
  if (workDone >= 1) {
    return make("ahead", "All tasks done", "Mark the project complete when it's delivered");
  }
  if (input.hasTasks === false) {
    return make("untracked", "No tasks yet", "Add tasks to track pace");
  }
  if (budgetUsed !== null && budgetUsed - workDone > OVER_BUDGET_THRESHOLD) {
    return make("over_budget", "Over budget pace", `${pct(budgetUsed)} of budget used for ${pct(workDone)} of the work`);
  }
  const elapsed = timeElapsed ?? 0;
  if (elapsed - workDone > BEHIND_THRESHOLD) {
    return make("behind", `Behind by ${Math.round((elapsed - workDone) * 100)} pts`, `${pct(elapsed)} of the time gone, ${pct(workDone)} done`);
  }
  return make(workDone >= elapsed ? "ahead" : "on_pace", workDone >= elapsed ? "Ahead of pace" : "On pace", `${pct(workDone)} done with ${pct(elapsed)} of the time gone`);
}
