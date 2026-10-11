import { describe, expect, it } from "vitest";

import { BASE, targetParams } from "./emotions";
import {
  BLINK_MS,
  EYE_MIN_HEIGHT,
  HOP_MS,
  POP_MS,
  SHAKE_MS,
  blinkFactor,
  bodyTransform,
  eyeGeometry,
  gazeToward,
  impulseOffset,
  stepParams,
} from "./rig";

function lidCornerYs(points: string): { left: number; right: number } {
  const [left, right] = points.split(" ").map((pair) => Number(pair.split(",")[1]));
  return { left, right };
}

describe("eyeGeometry", () => {
  it("lifts the inner corners for a positive lid tilt (sad)", () => {
    const sad = { ...BASE, lid: 0.4, lidTilt: 24 };
    // Left eye: inner corner is on the right; right eye: inner corner is on the left.
    const left = lidCornerYs(eyeGeometry(sad, 0).lidPoints);
    const right = lidCornerYs(eyeGeometry(sad, 1).lidPoints);
    expect(left.right).toBeLessThan(left.left);
    expect(right.left).toBeLessThan(right.right);
  });

  it("drops the inner corners for a negative lid tilt (determined)", () => {
    const determined = { ...BASE, lid: 0.4, lidTilt: -20 };
    const left = lidCornerYs(eyeGeometry(determined, 0).lidPoints);
    const right = lidCornerYs(eyeGeometry(determined, 1).lidPoints);
    expect(left.right).toBeGreaterThan(left.left);
    expect(right.left).toBeGreaterThan(right.right);
  });

  it("keeps a flat lid when there is no tilt", () => {
    const { left, right } = lidCornerYs(eyeGeometry({ ...BASE, lid: 0.3 }, 0).lidPoints);
    expect(left).toBeCloseTo(right, 5);
  });

  it("swaps the pill eye for the arc when happy", () => {
    const happy = eyeGeometry(targetParams("success"), 0);
    expect(happy.eyeOpacity).toBe(0);
    expect(happy.arcOpacity).toBe(1);
    expect(happy.arcPath).toMatch(/^M[\d.]+ [\d.]+ Q[\d.]+ [\d.]+ [\d.]+ [\d.]+$/);

    const neutral = eyeGeometry(BASE, 0);
    expect(neutral.eyeOpacity).toBe(1);
    expect(neutral.arcOpacity).toBe(0);
  });

  it("never lets the eye collapse below the height floor", () => {
    const closed = eyeGeometry({ ...BASE, open: 0 }, 0, 0);
    expect(closed.height).toBe(EYE_MIN_HEIGHT);
  });

  it("narrows the right eye only when asymmetric", () => {
    const params = targetParams("confirm");
    expect(eyeGeometry(params, 1).height).toBeLessThan(eyeGeometry(params, 0).height);
  });
});

describe("impulseOffset", () => {
  it("returns null once each impulse has finished", () => {
    expect(impulseOffset("hop", HOP_MS)).toBeNull();
    expect(impulseOffset("shake", SHAKE_MS)).toBeNull();
    expect(impulseOffset("pop", POP_MS)).toBeNull();
    expect(impulseOffset("pop", -1)).toBeNull();
  });

  it("jumps upward mid-hop", () => {
    const mid = impulseOffset("hop", HOP_MS / 2);
    expect(mid?.lift).toBeLessThan(-6);
  });

  it("crouches (squashes) at the start of a hop", () => {
    const crouch = impulseOffset("hop", HOP_MS * 0.09);
    expect(crouch?.sy).toBeLessThan(1);
    expect(crouch?.sx).toBeGreaterThan(1);
  });

  it("peaks the pop at 1.12 halfway through", () => {
    expect(impulseOffset("pop", POP_MS / 2)?.scale).toBeCloseTo(1.12, 5);
  });

  it("decays the shake", () => {
    const early = Math.abs(impulseOffset("shake", SHAKE_MS * (1 / 12))?.tilt ?? 0);
    const late = Math.abs(impulseOffset("shake", SHAKE_MS * (11 / 12))?.tilt ?? 0);
    expect(early).toBeGreaterThan(late);
  });
});

describe("bodyTransform", () => {
  it("is deterministic for a fixed clock and seed", () => {
    const params = targetParams("working");
    const a = bodyTransform(params, "working", null, 1234, 42);
    const b = bodyTransform(params, "working", null, 1234, 42);
    expect(a).toBe(b);
    expect(a).not.toBe(bodyTransform(params, "working", null, 1234, 43));
  });

  it("pivots on the base of the body", () => {
    expect(bodyTransform(BASE, "idle", null, 0, 0)).toContain("rotate(0.00 32 56)");
  });

  it("drops the bob and impulses when motion is reduced", () => {
    const hop = impulseOffset("hop", HOP_MS / 2);
    expect(bodyTransform(BASE, "idle", hop, 777, 3, true)).toBe(
      "translate(0.00 0.00) rotate(0.00 32 56) translate(32 56) scale(1.00 1.00) translate(-32 -56)",
    );
  });
});

describe("stepParams", () => {
  it("eases 15% of the way per 60fps frame", () => {
    const next = stepParams(BASE, { ...BASE, open: 2 }, 1000 / 60);
    expect(next.open).toBeCloseTo(1.15, 5);
  });

  it("does nothing for a zero-length frame", () => {
    expect(stepParams(BASE, targetParams("error"), 0)).toEqual(BASE);
  });

  it("clamps the gaze target", () => {
    let params = BASE;
    for (let i = 0; i < 200; i += 1) {
      params = stepParams(params, BASE, 1000 / 60, { gx: 5, gy: -5 });
    }
    expect(params.gx).toBeCloseTo(1.2, 3);
    expect(params.gy).toBeCloseTo(-1.2, 3);
  });
});

describe("blinkFactor", () => {
  it("closes the eye mid-blink and ends after 150ms", () => {
    expect(blinkFactor(BLINK_MS / 2)).toBeCloseTo(0.1, 5);
    expect(blinkFactor(BLINK_MS)).toBeNull();
  });
});

describe("gazeToward", () => {
  it("normalises and clamps the pointer offset", () => {
    expect(gazeToward({ x: 0, y: 0 }, { x: 110, y: -1000 })).toEqual({ tx: 0.5, ty: -1 });
  });
});
