import { describe, expect, it } from "vitest";
import { clampValue, parseNumberInput, scrubValue, stepValue } from "./scrub";

const pct = { min: 0, max: 100, step: 0.5 };

describe("scrubValue", () => {
  it("moves one step per 6px", () => expect(scrubValue(5, 12, pct, false)).toBe(6));
  it("moves ten steps with shift", () => expect(scrubValue(5, 6, pct, true)).toBe(10));
  it("goes down when dragging left", () => expect(scrubValue(5, -18, pct, false)).toBe(3.5));
  it("clamps at bounds", () => {
    expect(scrubValue(99, 600, pct, false)).toBe(100);
    expect(scrubValue(1, -600, pct, false)).toBe(0);
  });
  it("ignores jitter under one step", () => expect(scrubValue(5, 5, pct, false)).toBe(5));
});

describe("stepValue", () => {
  it("steps up and down", () => {
    expect(stepValue(5, 1, pct, false)).toBe(5.5);
    expect(stepValue(5, -1, pct, true)).toBe(0);
  });
  it("avoids float noise", () => expect(stepValue(0.1, 1, { min: 0, max: 1, step: 0.2 }, false)).toBe(0.3));
});

describe("clampValue", () => {
  it("clamps", () => expect(clampValue(-3, pct)).toBe(0));
});

describe("parseNumberInput", () => {
  it("parses plain and grouped numbers", () => {
    expect(parseNumberInput("12.5")).toBe(12.5);
    expect(parseNumberInput("1,250.00")).toBe(1250);
  });
  it("returns null for empty or junk", () => {
    expect(parseNumberInput("")).toBeNull();
    expect(parseNumberInput("abc")).toBeNull();
  });
});
