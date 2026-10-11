import type { KraftEmotion } from "@/lib/kraft/emotions";
import type { AiTurn } from "@/lib/ai-panel/types";

export type MascotEmotion = KraftEmotion;

/** How long each time-boxed emotion lasts. */
export const SURPRISED_MS = 900;
export const SUCCESS_MS = 2200;
export const PROUD_UNTIL_MS = 4600;
export const GREET_MS = 1400;
export const SLEEPY_AFTER_MS = 20_000;
export const WAKE_FLASH_MS = 650;

export type MascotStateInput = {
  latestTurn: AiTurn | null;
  composerHasText: boolean;
  drawerOpen: boolean;
  /** `null` if the latest turn is not done. */
  msSinceTurnDone: number | null;
  /** Since the last pointer or keyboard activity. */
  msSinceLastActivity: number;
  /** `null` while the drawer is closed. */
  msSinceDrawerOpened: number | null;
  /** Since the last trail step flipped running → done. */
  msSinceStepResolved: number | null;
  /** Since activity woke Kraft from `sleepy`; `null` if it has not dozed off. */
  msSinceWoke?: number | null;
};

function within(ms: number | null | undefined, limit: number): boolean {
  return ms !== null && ms !== undefined && ms >= 0 && ms < limit;
}

/**
 * Picks Kraft's emotion from the panel state. Pure: the launcher feeds it
 * elapsed times and re-derives on a short interval while any time-based
 * branch is pending. Highest priority first.
 */
export function deriveMascotEmotion(input: MascotStateInput): MascotEmotion {
  const turn = input.latestTurn;

  if (turn?.pendingConfirm) {
    return "confirm";
  }
  if (turn?.status === "error") {
    return "error";
  }
  if (turn?.status === "streaming") {
    if (within(input.msSinceStepResolved, SURPRISED_MS)) {
      return "surprised";
    }
    return turn.activeTool ? "working" : "thinking";
  }
  if (turn?.status === "done" && input.msSinceTurnDone !== null) {
    if (within(input.msSinceTurnDone, SUCCESS_MS)) {
      return "success";
    }
    if (within(input.msSinceTurnDone, PROUD_UNTIL_MS)) {
      return "proud";
    }
  }
  if (input.drawerOpen && within(input.msSinceDrawerOpened, GREET_MS)) {
    return "greet";
  }
  if (within(input.msSinceWoke, WAKE_FLASH_MS)) {
    return "surprised";
  }
  if (input.composerHasText) {
    return "listening";
  }
  if (input.msSinceLastActivity > SLEEPY_AFTER_MS) {
    return "sleepy";
  }
  return "idle";
}

/**
 * True while the derived emotion could change purely with the passage of
 * time, so the launcher knows whether it needs its re-derive interval.
 */
export function hasPendingTimer(input: MascotStateInput): boolean {
  const turn = input.latestTurn;
  if (turn?.status === "streaming" && within(input.msSinceStepResolved, SURPRISED_MS)) {
    return true;
  }
  if (turn?.status === "done" && within(input.msSinceTurnDone, PROUD_UNTIL_MS)) {
    return true;
  }
  if (input.drawerOpen && within(input.msSinceDrawerOpened, GREET_MS)) {
    return true;
  }
  if (within(input.msSinceWoke, WAKE_FLASH_MS)) {
    return true;
  }
  return input.msSinceLastActivity <= SLEEPY_AFTER_MS;
}

const STATUS_LINE: Record<MascotEmotion, string> = {
  idle: "Kraft",
  greet: "Hey there!",
  listening: "Listening…",
  thinking: "Thinking…",
  working: "Working…",
  surprised: "Ooh, found something!",
  success: "All set ✓",
  proud: "Nailed it",
  confirm: "Need your OK",
  error: "That didn't work, tap to see",
  sleepy: "Zzz…",
};

/** Kraft's one-line status, shown in the pill and the drawer header. */
export function mascotStatusLine(emotion: MascotEmotion, activeToolLabel: string | null): string {
  if (emotion === "working") {
    return activeToolLabel?.trim() || STATUS_LINE.working;
  }
  return STATUS_LINE[emotion];
}

export type PillState = "idle" | "busy" | "confirm" | "done" | "error";

const PILL_FOR: Record<MascotEmotion, PillState> = {
  idle: "idle",
  greet: "idle",
  sleepy: "idle",
  listening: "idle",
  thinking: "busy",
  working: "busy",
  surprised: "busy",
  success: "done",
  proud: "done",
  confirm: "confirm",
  error: "error",
};

/**
 * The pill's visual state. A wake-up `surprised` flash is not work, so it
 * stays idle when no turn is streaming.
 */
export function pillStateFor(emotion: MascotEmotion, streaming: boolean): PillState {
  if (emotion === "surprised" && !streaming) {
    return "idle";
  }
  return PILL_FOR[emotion];
}

/** True while Kraft is visibly doing something (status line in accent). */
export function isBusyEmotion(emotion: MascotEmotion): boolean {
  return emotion === "thinking" || emotion === "working" || emotion === "surprised";
}
