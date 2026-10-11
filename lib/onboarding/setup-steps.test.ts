import { describe, expect, it } from "vitest";
import {
  activeStepIndex,
  buildSetupSteps,
  isSetupTimelineComplete,
  revealFraction,
  SETUP_STEP_MS,
  setupProgress,
  setupTotalMs,
  stepStateAt,
} from "./setup-steps";

describe("buildSetupSteps", () => {
  it("returns the five-step ceremony in order", () => {
    const steps = buildSetupSteps();
    expect(steps.map((s) => s.id)).toEqual([
      "workspace",
      "client",
      "invoicing",
      "dashboard",
      "ready",
    ]);
  });

  it("personalizes the client step with a real name", () => {
    const steps = buildSetupSteps("Acme Studio");
    expect(steps[1].label).toBe("Adding Acme Studio");
  });

  it("trims whitespace around the client name", () => {
    const steps = buildSetupSteps("  Acme Studio  ");
    expect(steps[1].label).toBe("Adding Acme Studio");
  });

  it.each([undefined, null, "", "   "])(
    "falls back to a generic label when name is %p",
    (name) => {
      const steps = buildSetupSteps(name);
      expect(steps[1].label).toBe("Adding your first client");
    },
  );
});

describe("setupTotalMs", () => {
  it("multiplies step count by step duration", () => {
    expect(setupTotalMs(5)).toBe(5 * SETUP_STEP_MS);
    expect(setupTotalMs(3, 1000)).toBe(3000);
  });

  it("never returns negative", () => {
    expect(setupTotalMs(-2)).toBe(0);
  });
});

describe("activeStepIndex", () => {
  it("advances one step per interval and clamps to the last", () => {
    expect(activeStepIndex(0, 5, 700)).toBe(0);
    expect(activeStepIndex(699, 5, 700)).toBe(0);
    expect(activeStepIndex(700, 5, 700)).toBe(1);
    expect(activeStepIndex(2100, 5, 700)).toBe(3);
    expect(activeStepIndex(999999, 5, 700)).toBe(4);
  });

  it("clamps negative elapsed to the first step", () => {
    expect(activeStepIndex(-500, 5, 700)).toBe(0);
  });

  it("handles an empty step list without crashing", () => {
    expect(activeStepIndex(1000, 0, 700)).toBe(0);
  });
});

describe("stepStateAt", () => {
  const count = 5;

  it("marks earlier steps done, the current one active, later pending", () => {
    // elapsed 1500ms with 700ms steps → active index 2
    expect(stepStateAt(0, 1500, count, 700)).toBe("done");
    expect(stepStateAt(1, 1500, count, 700)).toBe("done");
    expect(stepStateAt(2, 1500, count, 700)).toBe("active");
    expect(stepStateAt(3, 1500, count, 700)).toBe("pending");
    expect(stepStateAt(4, 1500, count, 700)).toBe("pending");
  });

  it("keeps the final step active even after the timeline is exhausted", () => {
    expect(stepStateAt(4, 999999, count, 700)).toBe("active");
    expect(stepStateAt(3, 999999, count, 700)).toBe("done");
  });
});

describe("setupProgress", () => {
  it("runs 0 → 1 across the timeline", () => {
    expect(setupProgress(0, 5, 700)).toBe(0);
    expect(setupProgress(1750, 5, 700)).toBeCloseTo(0.5);
    expect(setupProgress(3500, 5, 700)).toBe(1);
  });

  it("clamps past the end to 1", () => {
    expect(setupProgress(999999, 5, 700)).toBe(1);
  });

  it("returns 1 for an empty timeline", () => {
    expect(setupProgress(0, 0, 700)).toBe(1);
  });
});

describe("revealFraction", () => {
  it("is 0 before the reveal point and 1 after the span", () => {
    expect(revealFraction(0, 1, 1, 700)).toBe(0);
    expect(revealFraction(699, 1, 1, 700)).toBe(0);
    expect(revealFraction(1400, 1, 1, 700)).toBe(1);
  });

  it("eases out across the span (past the linear midpoint at half time)", () => {
    // Halfway through a 1-step span, ease-out-cubic is well above 0.5.
    const f = revealFraction(700 + 350, 1, 1, 700);
    expect(f).toBeGreaterThan(0.5);
    expect(f).toBeLessThan(1);
  });

  it("respects a multi-step span", () => {
    expect(revealFraction(700, 1, 2, 700)).toBe(0);
    expect(revealFraction(2100, 1, 2, 700)).toBe(1);
  });

  it("clamps negative reveal index to start at time 0", () => {
    expect(revealFraction(0, -3, 1, 700)).toBe(0);
    expect(revealFraction(700, -3, 1, 700)).toBe(1);
  });
});

describe("isSetupTimelineComplete", () => {
  it("is false before and true at/after the total duration", () => {
    expect(isSetupTimelineComplete(3499, 5, 700)).toBe(false);
    expect(isSetupTimelineComplete(3500, 5, 700)).toBe(true);
    expect(isSetupTimelineComplete(9000, 5, 700)).toBe(true);
  });
});
