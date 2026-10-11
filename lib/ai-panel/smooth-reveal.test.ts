import { describe, expect, it } from "vitest";

import { MIN_CHARS_PER_SECOND, nextRevealLength, revealRate } from "./smooth-reveal";

describe("revealRate", () => {
  it("never drops below the reading pace", () => {
    expect(revealRate(1, true)).toBe(MIN_CHARS_PER_SECOND);
  });

  it("speeds up with a large backlog", () => {
    expect(revealRate(900, true)).toBeCloseTo(1000);
  });

  it("drains faster once the stream is done", () => {
    expect(revealRate(350, false)).toBeGreaterThan(revealRate(350, true));
  });
});

describe("nextRevealLength", () => {
  const text = "Q-0012 is already invoiced as INV-0006 and it's paid in full.";

  it("moves forward and stops at the end of a word", () => {
    const next = nextRevealLength(text, 0, 16, false);
    expect(next).toBeGreaterThan(0);
    expect(next === text.length || text[next - 1] === " ").toBe(true);
  });

  it("never goes backwards or past the text", () => {
    expect(nextRevealLength(text, 20, 0, true)).toBeGreaterThanOrEqual(20);
    expect(nextRevealLength(text, 0, 60_000, false)).toBe(text.length);
  });

  it("returns the full length once everything is shown", () => {
    expect(nextRevealLength(text, text.length, 16, true)).toBe(text.length);
  });

  it("holds back a word that is still arriving while streaming", () => {
    const partial = "Paid in fu";
    expect(nextRevealLength(partial, 0, 60_000, true)).toBe("Paid in ".length);
  });

  it("shows the last word once the stream is done", () => {
    const partial = "Paid in fu";
    expect(nextRevealLength(partial, 8, 60_000, false)).toBe(partial.length);
  });

  it("reveals across newlines", () => {
    const multi = "First line.\n\nSecond line.";
    expect(nextRevealLength(multi, 0, 60_000, false)).toBe(multi.length);
  });
});
