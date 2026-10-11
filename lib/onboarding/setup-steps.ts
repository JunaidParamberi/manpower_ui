/**
 * Pure timeline engine for the post-onboarding "setup ceremony".
 *
 * The real `completeOnboarding()` server action finishes in well under a second,
 * so the staged steps here are an intentional, theatrical sequence: each one ticks
 * off on a fixed timeline so the handoff *feels* like the workspace is being built
 * for the user (ClickUp / Linear first-run style) rather than a blank flash.
 *
 * Keep this file pure (no React, no DOM) so the timing math is unit-tested.
 */

/** Per-step display duration, in milliseconds. */
export const SETUP_STEP_MS = 700;

/** Stable identifiers for each setup step (used as React keys + in tests). */
export type SetupStepId =
  | "workspace"
  | "client"
  | "invoicing"
  | "dashboard"
  | "ready";

export type SetupStep = {
  id: SetupStepId;
  label: string;
};

/**
 * Per-step lifecycle state, derived from elapsed time.
 * - `pending`  — not started yet
 * - `active`   — currently running (shows AIThinking sparkle)
 * - `done`     — completed (shows a check)
 */
export type SetupStepState = "pending" | "active" | "done";

/**
 * Build the personalized step list. Step 2 ("client") uses the real client name
 * when the user added one during onboarding; on the skip path it falls back to a
 * friendly generic label.
 */
export function buildSetupSteps(clientName?: string | null): SetupStep[] {
  const trimmed = clientName?.trim();
  const clientLabel = trimmed
    ? `Adding ${trimmed}`
    : "Adding your first client";

  return [
    { id: "workspace", label: "Creating your workspace" },
    { id: "client", label: clientLabel },
    { id: "invoicing", label: "Setting up invoicing & tax" },
    { id: "dashboard", label: "Preparing your dashboard" },
    { id: "ready", label: "You're all set" },
  ];
}

/** Total time for the whole ceremony to reach its final "ready" step. */
export function setupTotalMs(
  stepCount: number,
  stepMs = SETUP_STEP_MS,
): number {
  return Math.max(0, stepCount) * stepMs;
}

/**
 * Index of the currently-active step for a given elapsed time. Clamps to the
 * last step once the timeline is exhausted (the final step stays "active" until
 * navigation resolves and the loader unmounts).
 */
export function activeStepIndex(
  elapsedMs: number,
  stepCount: number,
  stepMs = SETUP_STEP_MS,
): number {
  if (stepCount <= 0) return 0;
  const idx = Math.floor(Math.max(0, elapsedMs) / stepMs);
  return Math.min(idx, stepCount - 1);
}

/** Lifecycle state of a single step at a given elapsed time. */
export function stepStateAt(
  stepIndex: number,
  elapsedMs: number,
  stepCount: number,
  stepMs = SETUP_STEP_MS,
): SetupStepState {
  const active = activeStepIndex(elapsedMs, stepCount, stepMs);
  if (stepIndex < active) return "done";
  if (stepIndex > active) return "pending";
  // The active step (including the final one, which holds here until navigation
  // resolves and the loader unmounts) shows as "active".
  return "active";
}

/**
 * Fractional progress (0–1) across the whole ceremony, for a progress bar.
 * Reaches 1 when the timeline is exhausted.
 */
export function setupProgress(
  elapsedMs: number,
  stepCount: number,
  stepMs = SETUP_STEP_MS,
): number {
  const total = setupTotalMs(stepCount, stepMs);
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, elapsedMs) / total);
}

/**
 * Eased 0→1 reveal fraction for a visual element that starts animating when the
 * timeline reaches `revealAtIndex` and finishes `spanSteps` steps later. Drives
 * count-ups, ring sweeps, and sparkline draws straight from elapsed time so every
 * animated value is deterministic (and freezable in Storybook). Uses an
 * ease-out-cubic curve for a lively settle.
 */
export function revealFraction(
  elapsedMs: number,
  revealAtIndex: number,
  spanSteps = 1,
  stepMs = SETUP_STEP_MS,
): number {
  const span = Math.max(1, spanSteps) * stepMs;
  const start = Math.max(0, revealAtIndex) * stepMs;
  const t = (elapsedMs - start) / span;
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/** Whether the timeline portion of the ceremony has fully elapsed. */
export function isSetupTimelineComplete(
  elapsedMs: number,
  stepCount: number,
  stepMs = SETUP_STEP_MS,
): boolean {
  return elapsedMs >= setupTotalMs(stepCount, stepMs);
}
