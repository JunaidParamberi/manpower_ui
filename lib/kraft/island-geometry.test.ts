import { describe, expect, it } from "vitest";

import {
  ISLAND_MIN_HEIGHT,
  cardShift,
  clampAnchor,
  parseAnchor,
  ISLAND_MIN_WIDTH,
  clampRect,
  defaultRect,
  moveRect,
  pageBounds,
  parseRect,
  resizeRect,
  type Bounds,
} from "./island-geometry";

// 1440×900 window, 244px sidebar + handle, 52px app header.
const bounds: Bounds = pageBounds({ width: 1440, height: 900 }, 244, 52);

describe("pageBounds", () => {
  it("insets the page area by the margin", () => {
    expect(bounds).toEqual({ left: 256, top: 64, right: 1428, bottom: 888 });
  });
});

describe("defaultRect", () => {
  it("centres on the page area just above the bottom", () => {
    const rect = defaultRect(bounds);
    expect(rect.width).toBe(560);
    expect(rect.left + rect.width / 2).toBeCloseTo((bounds.left + bounds.right) / 2);
    expect(rect.top + rect.height).toBe(900 - 20);
  });

  it("fits a small window", () => {
    const small = pageBounds({ width: 900, height: 500 }, 244, 52);
    const rect = defaultRect(small);
    expect(rect.left).toBeGreaterThanOrEqual(small.left);
    expect(rect.top).toBeGreaterThanOrEqual(small.top);
    expect(rect.left + rect.width).toBeLessThanOrEqual(small.right);
    expect(rect.top + rect.height).toBeLessThanOrEqual(small.bottom);
  });
});

describe("moveRect", () => {
  const start = { left: 600, top: 300, width: 500, height: 500 };

  it("moves by the drag distance", () => {
    expect(moveRect(start, 40, -20, bounds)).toEqual({ left: 640, top: 280, width: 500, height: 500 });
  });

  it("stops at the sidebar and the app header", () => {
    const moved = moveRect(start, -2000, -2000, bounds);
    expect(moved.left).toBe(bounds.left);
    expect(moved.top).toBe(bounds.top);
  });

  it("stops at the window's right and bottom", () => {
    const moved = moveRect(start, 2000, 2000, bounds);
    expect(moved.left + moved.width).toBe(bounds.right);
    expect(moved.top + moved.height).toBe(bounds.bottom);
  });
});

describe("resizeRect", () => {
  const start = { left: 600, top: 300, width: 500, height: 500 };

  it("grows from the bottom-right corner, keeping the top-left fixed", () => {
    expect(resizeRect(start, "se", 50, 30, bounds)).toEqual({ left: 600, top: 300, width: 550, height: 530 });
  });

  it("grows from the left edge, keeping the right edge fixed", () => {
    const rect = resizeRect(start, "w", -100, 0, bounds);
    expect(rect.left).toBe(500);
    expect(rect.left + rect.width).toBe(1100);
  });

  it("never goes below the minimum size", () => {
    const rect = resizeRect(start, "nw", 1000, 1000, bounds);
    expect(rect.width).toBe(ISLAND_MIN_WIDTH);
    expect(rect.height).toBe(ISLAND_MIN_HEIGHT);
    expect(rect.left + rect.width).toBe(1100);
    expect(rect.top + rect.height).toBe(800);
  });

  it("never grows past the page area", () => {
    const rect = resizeRect(start, "ne", 5000, -5000, bounds);
    expect(rect.left + rect.width).toBe(bounds.right);
    expect(rect.top).toBe(bounds.top);
  });
});

describe("clampRect", () => {
  it("pulls a rect saved on a bigger screen back inside", () => {
    const small = pageBounds({ width: 1000, height: 700 }, 244, 52);
    const rect = clampRect({ left: 1200, top: 600, width: 700, height: 700 }, small);
    expect(rect.left).toBeGreaterThanOrEqual(small.left);
    expect(rect.left + rect.width).toBeLessThanOrEqual(small.right);
    expect(rect.top + rect.height).toBeLessThanOrEqual(small.bottom);
  });
});

describe("parseRect", () => {
  it("reads a stored rect", () => {
    expect(parseRect('{"left":1,"top":2,"width":3,"height":4}')).toEqual({ left: 1, top: 2, width: 3, height: 4 });
  });

  it("rejects missing or malformed values", () => {
    expect(parseRect(null)).toBeNull();
    expect(parseRect("nope")).toBeNull();
    expect(parseRect('{"left":"1","top":2,"width":3,"height":4}')).toBeNull();
    expect(parseRect("null")).toBeNull();
  });
});

describe("clampAnchor", () => {
  const size = { width: 140, height: 44 };

  it("leaves an anchor that fits alone", () => {
    expect(clampAnchor({ x: 800, bottom: 700 }, bounds, size)).toEqual({ x: 800, bottom: 700 });
  });

  it("keeps the whole bar inside the page area", () => {
    expect(clampAnchor({ x: 0, bottom: 0 }, bounds, size)).toEqual({ x: bounds.left + 70, bottom: bounds.top + 44 });
    expect(clampAnchor({ x: 5000, bottom: 5000 }, bounds, size)).toEqual({ x: bounds.right - 70, bottom: bounds.bottom });
  });
});

describe("cardShift", () => {
  it("is 0 when the card fits", () => {
    expect(cardShift(800, 380, bounds)).toBe(0);
  });

  it("slides right near the sidebar and left near the window edge", () => {
    expect(cardShift(bounds.left + 70, 380, bounds)).toBe(120);
    expect(cardShift(bounds.right - 70, 380, bounds)).toBe(-120);
  });
});

describe("parseAnchor", () => {
  it("reads a stored anchor and rejects junk", () => {
    expect(parseAnchor('{"x":10,"bottom":20}')).toEqual({ x: 10, bottom: 20 });
    expect(parseAnchor('{"x":"10","bottom":20}')).toBeNull();
    expect(parseAnchor("[")).toBeNull();
    expect(parseAnchor(null)).toBeNull();
  });
});
