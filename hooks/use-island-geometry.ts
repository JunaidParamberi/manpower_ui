"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  clampRect,
  defaultRect,
  moveRect,
  pageBounds,
  parseRect,
  resizeRect,
  type Bounds,
  type Edge,
  type Rect,
} from "@/lib/kraft/island-geometry";

/** localStorage key for the island's last dragged/resized rect. */
export const KRAFT_ISLAND_RECT_KEY = "kraft-island-rect";

const TOPBAR_FALLBACK = 52;

function readTopbarHeight(): number {
  const value = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-h"));
  return Number.isFinite(value) ? value : TOPBAR_FALLBACK;
}

type Gesture = { kind: "move" } | { kind: "resize"; edge: Edge };

export type IslandGeometry = {
  /** Where the island is, or null before the first measure (CSS default applies). */
  rect: Rect | null;
  /** True mid-drag or mid-resize. */
  interacting: boolean;
  /** Pointer-down on the drag handle (the header). */
  startMove: (event: React.PointerEvent) => void;
  /** Pointer-down on an edge or corner handle. */
  startResize: (edge: Edge) => (event: React.PointerEvent) => void;
  /** Back to bottom-centre at the default size. */
  reset: () => void;
};

/**
 * Lets the user drag Kraft's island anywhere in the page area and resize it
 * from any edge or corner. The page area is right of the sidebar (`pageLeft`)
 * and below the app header. The chosen rect is remembered per browser and
 * pulled back inside when the window shrinks or the sidebar grows; until the
 * user moves it, it stays at the default bottom-centre spot.
 */
export function useIslandGeometry(enabled: boolean, pageLeft: number): IslandGeometry {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [saved, setSaved] = useState<Rect | null>(null);
  const [interacting, setInteracting] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const measure = () =>
      setBounds(pageBounds({ width: window.innerWidth, height: window.innerHeight }, pageLeft, readTopbarHeight()));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [enabled, pageLeft]);

  useEffect(() => {
    try {
      setSaved(parseRect(window.localStorage.getItem(KRAFT_ISLAND_RECT_KEY)));
    } catch {
      // storage blocked: start at the default spot
    }
  }, []);

  const rect = bounds ? (saved ? clampRect(saved, bounds) : defaultRect(bounds)) : null;
  const rectRef = useRef(rect);
  rectRef.current = rect;
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  const begin = useCallback((gesture: Gesture, event: React.PointerEvent) => {
    const start = rectRef.current;
    const area = boundsRef.current;
    if (!start || !area || event.button !== 0) {
      return;
    }
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    const originX = event.clientX;
    const originY = event.clientY;
    let latest = start;
    setInteracting(true);

    const onMove = (move: PointerEvent) => {
      const dx = move.clientX - originX;
      const dy = move.clientY - originY;
      latest =
        gesture.kind === "move" ? moveRect(start, dx, dy, area) : resizeRect(start, gesture.edge, dx, dy, area);
      setSaved(latest);
    };
    const onEnd = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
      setInteracting(false);
      try {
        window.localStorage.setItem(KRAFT_ISLAND_RECT_KEY, JSON.stringify(latest));
      } catch {
        // storage blocked: the position lasts for this page view
      }
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  }, []);

  const startMove = useCallback(
    (event: React.PointerEvent) => {
      // Buttons and menus inside the header keep their own clicks.
      if ((event.target as HTMLElement).closest("button, a, input, textarea, [role='menu']")) {
        return;
      }
      begin({ kind: "move" }, event);
    },
    [begin],
  );

  const startResize = useCallback(
    (edge: Edge) => (event: React.PointerEvent) => begin({ kind: "resize", edge }, event),
    [begin],
  );

  const reset = useCallback(() => {
    setSaved(null);
    try {
      window.localStorage.removeItem(KRAFT_ISLAND_RECT_KEY);
    } catch {
      // nothing stored to clear
    }
  }, []);

  return { rect: enabled ? rect : null, interacting, startMove, startResize, reset };
}
