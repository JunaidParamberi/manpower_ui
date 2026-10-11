import { describe, expect, it } from "vitest";

import { isGlowing } from "./glow-state";

describe("isGlowing", () => {
  it("is false when nothing has published yet", () => {
    expect(isGlowing(null, 1000, 1500)).toBe(false);
  });

  it("is true immediately after publishing", () => {
    expect(isGlowing(1000, 1000, 1500)).toBe(true);
  });

  it("is true just before the duration elapses", () => {
    expect(isGlowing(1000, 2499, 1500)).toBe(true);
  });

  it("is false once the duration has elapsed", () => {
    expect(isGlowing(1000, 2500, 1500)).toBe(false);
  });

  it("is false well after the duration", () => {
    expect(isGlowing(1000, 10_000, 1500)).toBe(false);
  });
});
