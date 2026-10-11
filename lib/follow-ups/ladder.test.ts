import { describe, it, expect } from "vitest";

import {
  FOLLOW_UP_LADDER,
  rungCount,
  toneForRung,
  type FollowUpTrigger,
} from "./ladder";

const TRIGGERS: FollowUpTrigger[] = [
  "invoice_overdue",
  "invoice_due_soon",
  "document_unanswered",
  "project_stale",
];

describe("FOLLOW_UP_LADDER", () => {
  it("defines at least one rung for every trigger", () => {
    for (const trigger of TRIGGERS) {
      expect(FOLLOW_UP_LADDER[trigger].length).toBeGreaterThan(0);
    }
  });

  it("orders rungs by ascending offset so rung N is always reached before rung N+1", () => {
    for (const trigger of TRIGGERS) {
      const offsets = FOLLOW_UP_LADDER[trigger].map((rung) => rung.offsetDays);
      const sorted = [...offsets].sort((a, b) => a - b);
      expect(offsets).toEqual(sorted);
    }
  });

  it("escalates invoice_overdue friendly -> firm -> formal", () => {
    expect(FOLLOW_UP_LADDER.invoice_overdue.map((rung) => rung.tone)).toEqual([
      "friendly",
      "firm",
      "formal",
    ]);
  });

  it("nudges invoice_due_soon before the due date", () => {
    expect(FOLLOW_UP_LADDER.invoice_due_soon).toEqual([
      { offsetDays: -3, tone: "friendly" },
    ]);
  });
});

describe("toneForRung", () => {
  it("returns the tone defined for the rung", () => {
    expect(toneForRung("invoice_overdue", 0)).toBe("friendly");
    expect(toneForRung("invoice_overdue", 1)).toBe("firm");
    expect(toneForRung("invoice_overdue", 2)).toBe("formal");
  });

  it("keeps check-in triggers friendly at every rung", () => {
    expect(toneForRung("project_stale", 0)).toBe("friendly");
    expect(toneForRung("project_stale", 1)).toBe("friendly");
  });

  it("falls back to the last defined rung instead of throwing when out of range", () => {
    expect(toneForRung("invoice_due_soon", 5)).toBe("friendly");
    expect(toneForRung("document_unanswered", 99)).toBe("firm");
  });

  it("falls back to the first rung for a negative rung", () => {
    expect(toneForRung("invoice_overdue", -1)).toBe("friendly");
  });
});

describe("rungCount", () => {
  it("reports how many rungs each trigger has", () => {
    expect(rungCount("invoice_overdue")).toBe(3);
    expect(rungCount("invoice_due_soon")).toBe(1);
    expect(rungCount("document_unanswered")).toBe(2);
    expect(rungCount("project_stale")).toBe(2);
  });
});
