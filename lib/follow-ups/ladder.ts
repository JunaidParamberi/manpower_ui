// lib/follow-ups/ladder.ts
//
// Escalation ladder for the Follow-Up Engine. Zero imports — not even
// `import type` — so this file resolves identically under Node (Vitest) and
// Deno (the follow-up-engine Edge Function) without an import map. Same
// constraint as lib/projects/digest-facts.ts.

export type FollowUpTrigger =
  | "invoice_overdue"
  | "invoice_due_soon"
  | "document_unanswered"
  | "project_stale";

export type FollowUpTone = "friendly" | "firm" | "formal";

export type LadderRung = {
  /**
   * Whole calendar days past the trigger's reference date. Negative means
   * "before" the reference date, used by invoice_due_soon to nudge ahead of
   * the due date rather than chase after it.
   */
  offsetDays: number;
  tone: FollowUpTone;
};

/**
 * Rungs are ordered by ascending offset, so rung N is always reached before
 * rung N+1. detectFollowUps relies on that ordering to pick the highest
 * reached rung.
 *
 * Reference date per trigger:
 *   invoice_overdue      invoice due_date
 *   invoice_due_soon     invoice due_date
 *   document_unanswered  document sent_at (falls back to updated_at)
 *   project_stale        latest of project updated_at and newest task updated_at
 */
export const FOLLOW_UP_LADDER: Record<FollowUpTrigger, LadderRung[]> = {
  invoice_overdue: [
    { offsetDays: 3, tone: "friendly" },
    { offsetDays: 10, tone: "firm" },
    { offsetDays: 21, tone: "formal" },
  ],
  invoice_due_soon: [{ offsetDays: -3, tone: "friendly" }],
  document_unanswered: [
    { offsetDays: 5, tone: "friendly" },
    { offsetDays: 14, tone: "firm" },
  ],
  // A check-in is never a demand, so the tone stays friendly at both rungs.
  project_stale: [
    { offsetDays: 14, tone: "friendly" },
    { offsetDays: 30, tone: "friendly" },
  ],
};

export function rungCount(trigger: FollowUpTrigger): number {
  return FOLLOW_UP_LADDER[trigger].length;
}

/**
 * Tone for a ladder position. Clamps rather than throwing: a row written by an
 * older ladder must still render, and a card that cannot pick a tone is worse
 * than one that picks a slightly wrong one.
 */
export function toneForRung(trigger: FollowUpTrigger, rung: number): FollowUpTone {
  const rungs = FOLLOW_UP_LADDER[trigger];
  const index = Math.min(Math.max(rung, 0), rungs.length - 1);
  return rungs[index].tone;
}
