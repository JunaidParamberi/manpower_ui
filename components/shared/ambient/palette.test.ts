import { describe, expect, it } from "vitest";
import { AMBIENT_COLORS, AMBIENT_PALETTE, GRADIENT_STOPS } from "./palette";

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe("AMBIENT_COLORS", () => {
  it("has 5 valid 6-digit hex colors", () => {
    const values = Object.values(AMBIENT_COLORS);
    expect(values).toHaveLength(5);
    for (const v of values) expect(v).toMatch(HEX);
  });

  it("matches the documented module palette exactly", () => {
    expect(AMBIENT_COLORS).toEqual({
      blue: "#3550E0",
      violet: "#7C5CFF",
      teal: "#12B5A6",
      amber: "#F5A524",
      rose: "#F2557A",
    });
  });
});

describe("AMBIENT_PALETTE", () => {
  it("lists the 5 colors in blue/violet/teal/amber/rose order", () => {
    expect(AMBIENT_PALETTE).toEqual([
      AMBIENT_COLORS.blue,
      AMBIENT_COLORS.violet,
      AMBIENT_COLORS.teal,
      AMBIENT_COLORS.amber,
      AMBIENT_COLORS.rose,
    ]);
  });
});

describe("GRADIENT_STOPS", () => {
  it("is blue -> violet -> rose, matching the headline gradient", () => {
    expect(GRADIENT_STOPS).toEqual([
      AMBIENT_COLORS.blue,
      AMBIENT_COLORS.violet,
      AMBIENT_COLORS.rose,
    ]);
  });
});
