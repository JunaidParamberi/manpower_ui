/**
 * Kraft's rig as pure geometry, ported from `Face.prototype.tick` in the
 * approved mockup (`docs/superpowers/specs/assets/2026-10-07-kraft-assistant/kraft-mockup.html`).
 * Everything here maps numbers to numbers/strings so it can be unit-tested
 * without a DOM; `KraftFace` owns the clock, the pointer and the SVG nodes.
 *
 * Coordinates are in the face's 64-unit viewBox. The body is the squircle
 * `x10 y12 w44 h44 rx15`; transforms pivot on its base centre (32, 56).
 */

import { BASE, type KraftEmotion, type KraftImpulseKind, type KraftParams } from "./emotions";

/** One 60fps frame — the mockup's easing factors were tuned per frame. */
const FRAME_MS = 1000 / 60;
const EASE = 0.15;
const GAZE_EASE = 0.2;
const GAZE_LIMIT = 1.2;

export const BLINK_MS = 150;
export const HOP_MS = 620;
export const SHAKE_MS = 560;
export const POP_MS = 400;

const PARAM_KEYS = Object.keys(BASE) as (keyof KraftParams)[];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Frame-rate independent version of `p += (t - p) * factor` at 60fps. */
function easeFactor(perFrame: number, dtMs: number): number {
  if (dtMs <= 0) {
    return 0;
  }
  return 1 - Math.pow(1 - perFrame, dtMs / FRAME_MS);
}

/**
 * Eases every param toward `target`. Gaze uses its own (snappier) factor and
 * may be overridden by `gaze` — the target gaze plus pointer tracking and
 * idle glances — clamped to ±1.2 like the mockup.
 */
export function stepParams(
  current: KraftParams,
  target: KraftParams,
  dtMs: number,
  gaze?: { gx: number; gy: number },
): KraftParams {
  const k = easeFactor(EASE, dtMs);
  const kg = easeFactor(GAZE_EASE, dtMs);
  const next = { ...current };
  for (const key of PARAM_KEYS) {
    if (key === "gx" || key === "gy") {
      continue;
    }
    next[key] = current[key] + (target[key] - current[key]) * k;
  }
  const gx = clamp(gaze?.gx ?? target.gx, -GAZE_LIMIT, GAZE_LIMIT);
  const gy = clamp(gaze?.gy ?? target.gy, -GAZE_LIMIT, GAZE_LIMIT);
  next.gx = current.gx + (gx - current.gx) * kg;
  next.gy = current.gy + (gy - current.gy) * kg;
  return next;
}

/** Eye openness multiplier during a blink: 1 → 0.1 → 1 over 150ms, `null` once finished. */
export function blinkFactor(elapsedMs: number): number | null {
  if (elapsedMs < 0 || elapsedMs >= BLINK_MS) {
    return null;
  }
  return 1 - Math.sin((elapsedMs / BLINK_MS) * Math.PI) * 0.9;
}

/** Pointer tracking: offset of the pointer from the face centre, normalised to ±1 over 220px. */
export function gazeToward(
  center: { x: number; y: number },
  pointer: { x: number; y: number },
): { tx: number; ty: number } {
  return {
    tx: clamp((pointer.x - center.x) / 220, -1, 1),
    ty: clamp((pointer.y - center.y) / 220, -1, 1),
  };
}

function f2(n: number): string {
  return n.toFixed(2);
}

export type EyeSide = 0 | 1;

export type EyeGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  /** `points` for the clip polygon that cuts the eyelid. */
  lidPoints: string;
  /** `d` for the happy `^` arc. */
  arcPath: string;
  eyeOpacity: number;
  arcOpacity: number;
};

/** Smallest eye height, so a near-closed (sleepy) eye still reads as a line. */
export const EYE_MIN_HEIGHT = 1.4;

/**
 * Eye rect, eyelid clip and happy arc for one side (0 = left, 1 = right).
 * `blink` multiplies the open height (1 = no blink).
 */
export function eyeGeometry(params: KraftParams, side: EyeSide, blink = 1): EyeGeometry {
  const cx = (side ? 39.5 : 24.5) + params.gx * 2.4;
  const cy = 33 + params.gy * 2.2;
  const width = 5.6 * params.eyeW;
  const asymScale = side ? 1 - params.asym * 0.45 : 1;
  const height = Math.max(EYE_MIN_HEIGHT, 11 * params.open * blink * asymScale);
  const y = cy - height / 2;

  // Eyelid: clip the top of the eye along a tilted line. The slope flips per
  // side so a positive tilt lifts both inner corners (sad) and a negative
  // tilt drops them (determined).
  const slope = Math.tan((params.lidTilt * Math.PI) / 180) * (side ? 1 : -1);
  const base = y + height * params.lid;
  const left = cx - 8;
  const right = cx + 8;
  const lidPoints =
    `${f2(left)},${f2(base + slope * (left - cx))} ` +
    `${f2(right)},${f2(base + slope * (right - cx))} ` +
    `${f2(right)},60 ${f2(left)},60`;

  const arcPath = `M${f2(cx - 4)} ${f2(cy + 1.5)} Q${f2(cx)} ${f2(cy - 4.6)} ${f2(cx + 4)} ${f2(cy + 1.5)}`;

  return {
    x: cx - width / 2,
    y,
    width,
    height,
    rx: Math.min(width, height) / 2,
    lidPoints,
    arcPath,
    eyeOpacity: clamp(1 - params.happy, 0, 1),
    arcOpacity: clamp(params.happy, 0, 1),
  };
}

export type ImpulseOffset = {
  /** Added to the body lift (negative = up). */
  lift: number;
  /** Added to the body tilt, degrees. */
  tilt: number;
  /** Horizontal offset, units. */
  dx: number;
  /** Multipliers on the squash/stretch. */
  sx: number;
  sy: number;
  /** Uniform scale multiplier. */
  scale: number;
};

const NO_OFFSET: ImpulseOffset = { lift: 0, tilt: 0, dx: 0, sx: 1, sy: 1, scale: 1 };

export function impulseDuration(kind: KraftImpulseKind): number {
  return kind === "hop" ? HOP_MS : kind === "shake" ? SHAKE_MS : POP_MS;
}

/**
 * Body offset for a one-shot impulse `elapsedMs` after it started, or `null`
 * once it has finished (the caller then drops the impulse).
 * - hop: crouch, jump 7 units, land squash (620ms)
 * - shake: decaying ±9° wobble (560ms)
 * - pop: scale up to 1.12 and back (400ms)
 */
export function impulseOffset(kind: KraftImpulseKind, elapsedMs: number): ImpulseOffset | null {
  if (elapsedMs < 0 || elapsedMs >= impulseDuration(kind)) {
    return null;
  }

  if (kind === "hop") {
    const u = elapsedMs / HOP_MS;
    if (u < 0.18) {
      const a = Math.sin((Math.PI * u) / 0.18) * 0.12;
      return { ...NO_OFFSET, sx: 1 + a, sy: 1 - a };
    }
    if (u < 0.82) {
      const v = Math.sin(Math.PI * ((u - 0.18) / 0.64));
      return { ...NO_OFFSET, lift: -v * 7, sx: 1 - v * 0.04, sy: 1 + v * 0.06 };
    }
    const w = Math.sin((Math.PI * (u - 0.82)) / 0.18) * 0.08;
    return { ...NO_OFFSET, sx: 1 + w, sy: 1 - w };
  }

  if (kind === "shake") {
    const u = elapsedMs / SHAKE_MS;
    const e = Math.sin(u * Math.PI * 6) * (1 - u);
    return { ...NO_OFFSET, tilt: e * 9, dx: e * 2.2 };
  }

  const u = elapsedMs / POP_MS;
  return { ...NO_OFFSET, scale: 1 + Math.sin(Math.PI * u) * 0.12 };
}

/**
 * The body's SVG `transform`: ambient bob (faster while working, slow
 * squash-breathe while sleepy) plus any impulse, pivoting on the base.
 * `seed` desynchronises faces that share a clock. With `reducedMotion` the
 * pose is static apart from the emotion's own tilt/lift/squash.
 */
export function bodyTransform(
  params: KraftParams,
  emotion: KraftEmotion,
  impulse: ImpulseOffset | null,
  nowMs: number,
  seed: number,
  reducedMotion = false,
): string {
  let lift = params.lift;
  let sx = params.sx;
  let sy = params.sy;

  if (!reducedMotion) {
    const s = nowMs + seed;
    if (emotion === "working") {
      lift += Math.sin(s / 95) * 0.45;
    } else if (emotion === "sleepy") {
      const breath = Math.sin(s / 900) * 0.03;
      sx += breath;
      sy -= breath;
    } else {
      lift += Math.sin(s / 520) * 0.6;
    }
  }

  const offset = reducedMotion || !impulse ? NO_OFFSET : impulse;
  const tilt = params.tilt + offset.tilt;
  lift += offset.lift;
  sx *= offset.sx * offset.scale;
  sy *= offset.sy * offset.scale;

  return (
    `translate(${f2(offset.dx)} ${f2(lift)}) rotate(${f2(tilt)} 32 56) ` +
    `translate(32 56) scale(${f2(sx)} ${f2(sy)}) translate(-32 -56)`
  );
}
