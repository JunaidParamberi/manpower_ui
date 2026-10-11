/**
 * Kraft's emotion presets, ported verbatim from the approved mockup
 * (`docs/superpowers/specs/assets/2026-10-07-kraft-assistant/kraft-mockup.html`,
 * search "Kraft · simple rig"). Emotion lives only in eye shape and body
 * motion — the mockup's mouth params (`mw`, `mc`, `mo`, `mx`) are dropped
 * because the chosen squircle variant has no mouth.
 */

export const KRAFT_EMOTIONS = [
  "idle",
  "greet",
  "listening",
  "thinking",
  "working",
  "surprised",
  "confirm",
  "success",
  "proud",
  "error",
  "sleepy",
] as const;

export type KraftEmotion = (typeof KRAFT_EMOTIONS)[number];

export type KraftParams = {
  /** Eye open height multiplier (1 = 11 units). */
  open: number;
  /** Eye width multiplier (1 = 5.6 units). */
  eyeW: number;
  /** 0 → pill eyes, 1 → happy `^^` arcs. */
  happy: number;
  /** Gaze, roughly -1..1 on each axis. */
  gx: number;
  gy: number;
  /** Eyelid cut as a fraction of eye height from the top. */
  lid: number;
  /** Eyelid tilt in degrees: positive lifts the inner corner (sad), negative drops it (determined). */
  lidTilt: number;
  /** Right eye shrinks by `asym * 45%` — a skeptical squint. */
  asym: number;
  /** Body rotation in degrees around the base. */
  tilt: number;
  /** Body offset in units; positive sinks, negative rises. */
  lift: number;
  /** Squash and stretch. */
  sx: number;
  sy: number;
  /** Accent marks, 0..1 opacity. */
  q: number;
  bang: number;
  zzz: number;
  dots: number;
  spark: number;
  ring: number;
  /** Error tint on the body fill. */
  tint: number;
};

export type KraftAccent = "q" | "bang" | "zzz" | "dots" | "spark" | "ring";

export const KRAFT_ACCENTS: readonly KraftAccent[] = ["ring", "dots", "zzz", "q", "bang", "spark"];

export const BASE: KraftParams = {
  open: 1,
  eyeW: 1,
  happy: 0,
  gx: 0,
  gy: 0,
  lid: 0,
  lidTilt: 0,
  asym: 0,
  tilt: 0,
  lift: 0,
  sx: 1,
  sy: 1,
  q: 0,
  bang: 0,
  zzz: 0,
  dots: 0,
  spark: 0,
  ring: 0,
  tint: 0,
};

export const EMO: Record<KraftEmotion, Partial<KraftParams>> = {
  idle: {},
  greet: { happy: 1, tilt: -7 },
  listening: { open: 1.12, gx: -0.3, gy: 0.5, tilt: -6, sx: 0.98, sy: 1.03 },
  thinking: { open: 0.9, gx: 0.9, gy: -0.9, tilt: 7, dots: 1, asym: 0.25 },
  working: { open: 0.82, gy: 0.5, lid: 0.4, lidTilt: -20, ring: 1 },
  surprised: { open: 1.3, eyeW: 1.12, sx: 0.95, sy: 1.07, bang: 1 },
  success: { happy: 1, spark: 1 },
  proud: { happy: 0.9, tilt: 5 },
  confirm: { open: 1.05, gx: -0.7, gy: 0.6, tilt: 11, q: 1, asym: 0.45 },
  error: { open: 0.9, gy: 0.8, lid: 0.38, lidTilt: 24, tint: 1, tilt: -4, lift: 1.5, sx: 1.04, sy: 0.95 },
  sleepy: { open: 0.14, gy: 0.5, zzz: 1, tilt: -5, lift: 1, sx: 1.04, sy: 0.95 },
};

/** How strongly each emotion's gaze follows the pointer (0 / absent = not at all). */
export const TRACK: Partial<Record<KraftEmotion, number>> = {
  idle: 1,
  greet: 0.6,
  listening: 0.5,
  success: 0.3,
  proud: 0.5,
  surprised: 0.4,
};

export type KraftImpulseKind = "hop" | "shake" | "pop";

/** One-shot body motion played when an emotion is entered. */
export const IMPULSE: Partial<Record<KraftEmotion, KraftImpulseKind>> = {
  success: "hop",
  greet: "hop",
  error: "shake",
  surprised: "pop",
  confirm: "pop",
  proud: "pop",
};

export function targetParams(emotion: KraftEmotion): KraftParams {
  return { ...BASE, ...EMO[emotion] };
}

export function isKraftEmotion(value: string): value is KraftEmotion {
  return (KRAFT_EMOTIONS as readonly string[]).includes(value);
}
