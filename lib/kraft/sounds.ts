import type { KraftEmotion } from "./emotions";

/**
 * Kraft's sound picks: real recordings from Kenney "Interface Sounds" (CC0),
 * served from `public/sounds/kraft/` (licence file alongside). Played through
 * `use-sound` by `hooks/use-kraft-sound.ts`. Kept deliberately quiet: a low
 * master volume, per-clip trims so no single clip stands out, and ambient
 * moments (dozing off, waking) only audible while the drawer is open.
 */
export const KRAFT_SOUNDS = [
  "greet",
  "open",
  "close",
  "thinking",
  "working",
  "surprised",
  "confirm",
  "success",
  "proud",
  "error",
  "sleepy",
] as const;

export type KraftSound = (typeof KRAFT_SOUNDS)[number];

export function kraftSoundSrc(sound: KraftSound): string {
  return `/sounds/kraft/${sound}.mp3`;
}

/**
 * Relative loudness per clip, multiplied by the user's volume. The busy-loop
 * clips (thinking, working) and the ambient ones sit lowest because they can
 * repeat; the moments that need the user (confirm, error) keep the most.
 */
export const KRAFT_SOUND_GAIN: Record<KraftSound, number> = {
  greet: 0.55,
  open: 0.5,
  close: 0.45,
  thinking: 0.45,
  working: 0.35,
  surprised: 0.5,
  confirm: 0.8,
  success: 0.7,
  proud: 0.45,
  error: 0.75,
  sleepy: 0.4,
};

/** Minimum gap before the same clip may play again. */
export const KRAFT_SOUND_THROTTLE_MS: Record<KraftSound, number> = {
  greet: 120,
  open: 120,
  close: 120,
  thinking: 120,
  // Agent runs can fire several tools in quick succession; one soft tick per
  // burst is enough.
  working: 1200,
  surprised: 600,
  confirm: 120,
  success: 120,
  proud: 120,
  error: 120,
  sleepy: 120,
};

export function shouldThrottle(sound: KraftSound, lastPlayedAt: number | undefined, now: number): boolean {
  return lastPlayedAt !== undefined && now - lastPlayedAt < KRAFT_SOUND_THROTTLE_MS[sound];
}

const SOUND_FOR_EMOTION: Partial<Record<KraftEmotion, KraftSound>> = {
  greet: "greet",
  thinking: "thinking",
  working: "working",
  surprised: "surprised",
  confirm: "confirm",
  success: "success",
  proud: "proud",
  error: "error",
  sleepy: "sleepy",
};

export type SoundTransitionContext = {
  drawerOpen: boolean;
  /** Tool-start counts before and after; a new tool while working replays `working`. */
  prevToolStarts?: number;
  nextToolStarts?: number;
};

/**
 * Which clip (if any) marks a change in Kraft's emotion. Fires only on a
 * change, never for `→ idle` / `→ listening`, and re-fires `working` on each
 * new `tool_start`. Dozing off and the wake-up surprise are ambient — they
 * stay silent unless the drawer is open, so Kraft never chimes while the
 * user is just working on the page.
 */
export function soundForTransition(
  prev: KraftEmotion,
  next: KraftEmotion,
  context: SoundTransitionContext,
): KraftSound | null {
  if (prev === next) {
    const newTool = (context.nextToolStarts ?? 0) > (context.prevToolStarts ?? 0);
    return next === "working" && newTool ? "working" : null;
  }

  const ambient = next === "sleepy" || (prev === "sleepy" && next === "surprised");
  if (ambient && !context.drawerOpen) {
    return null;
  }

  return SOUND_FOR_EMOTION[next] ?? null;
}
