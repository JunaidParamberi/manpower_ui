/**
 * Geometry for Kraft's island: where it sits and how big it is when the
 * user drags or resizes it. All rects are viewport pixels. The island must
 * stay inside the page area (right of the sidebar, below the app header),
 * so every result is clamped to `bounds`.
 */

export type Rect = { left: number; top: number; width: number; height: number };
export type Bounds = { left: number; top: number; right: number; bottom: number };
export type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export const ISLAND_MIN_WIDTH = 360;
export const ISLAND_MIN_HEIGHT = 320;
export const ISLAND_DEFAULT_WIDTH = 560;
export const ISLAND_DEFAULT_HEIGHT = 600;
/** Gap between the island and the page area's edges. */
export const ISLAND_MARGIN = 12;
/** The default island sits this far above the bottom of the window. */
export const ISLAND_BOTTOM_GAP = 20;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** The page area the island may occupy, inset by the margin. */
export function pageBounds(viewport: { width: number; height: number }, pageLeft: number, pageTop: number): Bounds {
  return {
    left: pageLeft + ISLAND_MARGIN,
    top: pageTop + ISLAND_MARGIN,
    right: viewport.width - ISLAND_MARGIN,
    bottom: viewport.height - ISLAND_MARGIN,
  };
}

/** Shrinks the rect to fit the bounds, then slides it fully inside them. */
export function clampRect(rect: Rect, bounds: Bounds): Rect {
  const maxWidth = bounds.right - bounds.left;
  const maxHeight = bounds.bottom - bounds.top;
  const width = clamp(rect.width, Math.min(ISLAND_MIN_WIDTH, maxWidth), maxWidth);
  const height = clamp(rect.height, Math.min(ISLAND_MIN_HEIGHT, maxHeight), maxHeight);
  return {
    width,
    height,
    left: clamp(rect.left, bounds.left, bounds.right - width),
    top: clamp(rect.top, bounds.top, bounds.bottom - height),
  };
}

/** Bottom-centre of the page area, the island's home position. */
export function defaultRect(bounds: Bounds): Rect {
  const width = Math.min(ISLAND_DEFAULT_WIDTH, bounds.right - bounds.left);
  const height = Math.min(ISLAND_DEFAULT_HEIGHT, bounds.bottom - bounds.top);
  return clampRect(
    {
      width,
      height,
      left: bounds.left + (bounds.right - bounds.left - width) / 2,
      top: bounds.bottom + ISLAND_MARGIN - ISLAND_BOTTOM_GAP - height,
    },
    bounds,
  );
}

export function moveRect(start: Rect, dx: number, dy: number, bounds: Bounds): Rect {
  return clampRect({ ...start, left: start.left + dx, top: start.top + dy }, bounds);
}

/**
 * Resizes from one edge or corner. The opposite edge stays put, and the
 * dragged edge stops at the minimum size and at the bounds.
 */
export function resizeRect(start: Rect, edge: Edge, dx: number, dy: number, bounds: Bounds): Rect {
  let { left, top } = start;
  let right = start.left + start.width;
  let bottom = start.top + start.height;

  if (edge.includes("e")) {
    right = clamp(right + dx, left + ISLAND_MIN_WIDTH, bounds.right);
  }
  if (edge.includes("w")) {
    left = clamp(left + dx, bounds.left, right - ISLAND_MIN_WIDTH);
  }
  if (edge.includes("s")) {
    bottom = clamp(bottom + dy, top + ISLAND_MIN_HEIGHT, bounds.bottom);
  }
  if (edge.includes("n")) {
    top = clamp(top + dy, bounds.top, bottom - ISLAND_MIN_HEIGHT);
  }
  return clampRect({ left, top, width: right - left, height: bottom - top }, bounds);
}

/** Reads a stored rect, or null if it is missing or malformed. */
export function parseRect(raw: string | null): Rect | null {
  if (!raw) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) {
      return null;
    }
    const { left, top, width, height } = value as Record<string, unknown>;
    if ([left, top, width, height].every((n) => typeof n === "number" && Number.isFinite(n))) {
      return { left: left as number, top: top as number, width: width as number, height: height as number };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * The closed bar's spot: the centre of its bottom edge. Anchoring there
 * keeps it put while its label grows and shrinks, and lets the peek card
 * grow up out of the same point.
 */
export type Anchor = { x: number; bottom: number };

/** Keeps a bar of the given size fully inside the bounds. */
export function clampAnchor(anchor: Anchor, bounds: Bounds, size: { width: number; height: number }): Anchor {
  const half = size.width / 2;
  return {
    x: clamp(anchor.x, bounds.left + half, bounds.right - half),
    bottom: clamp(anchor.bottom, bounds.top + size.height, bounds.bottom),
  };
}

/**
 * How far to slide a card centred on the anchor so it stays inside the
 * bounds (the peek card is wider than the bar). 0 when it already fits.
 */
export function cardShift(anchorX: number, cardWidth: number, bounds: Bounds): number {
  const half = cardWidth / 2;
  if (anchorX - half < bounds.left) {
    return bounds.left - (anchorX - half);
  }
  if (anchorX + half > bounds.right) {
    return bounds.right - (anchorX + half);
  }
  return 0;
}

/** Reads a stored anchor, or null if it is missing or malformed. */
export function parseAnchor(raw: string | null): Anchor | null {
  if (!raw) {
    return null;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) {
      return null;
    }
    const { x, bottom } = value as Record<string, unknown>;
    return typeof x === "number" && Number.isFinite(x) && typeof bottom === "number" && Number.isFinite(bottom)
      ? { x, bottom }
      : null;
  } catch {
    return null;
  }
}
