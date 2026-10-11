"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { clampAnchor, pageBounds, parseAnchor, type Anchor, type Bounds } from "@/lib/kraft/island-geometry";

/** localStorage key for where the user dragged Kraft's closed bar. */
export const KRAFT_BAR_ANCHOR_KEY = "kraft-bar-anchor";

/** A press that moves less than this is a click, not a drag. */
const DRAG_THRESHOLD = 4;
const FALLBACK_SIZE = { width: 48, height: 44 };

export type BarPosition = {
  /** Where the bar sits, or null for the default bottom-centre spot. */
  anchor: Anchor | null;
  bounds: Bounds | null;
  dragging: boolean;
  /** Spread onto the element that wraps the bar. */
  handlers: {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
    onClickCapture: (event: React.MouseEvent) => void;
  };
};

/**
 * Lets the user drag Kraft's closed bar anywhere in the page area so it
 * never sits on top of what they're working on. A short press still opens
 * Kraft; anything past a few pixels is a drag and swallows the click. The
 * spot is remembered per browser and kept inside the page area when the
 * window or sidebar changes.
 */
export function useBarPosition(enabled: boolean, pageLeft: number): BarPosition {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [saved, setSaved] = useState<Anchor | null>(null);
  const [dragging, setDragging] = useState(false);
  const sizeRef = useRef(FALLBACK_SIZE);
  const swallowClick = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const measure = () => {
      const topbar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-h"));
      setBounds(
        pageBounds(
          { width: window.innerWidth, height: window.innerHeight },
          pageLeft,
          Number.isFinite(topbar) ? topbar : 52,
        ),
      );
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [enabled, pageLeft]);

  useEffect(() => {
    try {
      setSaved(parseAnchor(window.localStorage.getItem(KRAFT_BAR_ANCHOR_KEY)));
    } catch {
      // storage blocked: default spot
    }
  }, []);

  const anchor = enabled && saved && bounds ? clampAnchor(saved, bounds, sizeRef.current) : null;
  const boundsRef = useRef(bounds);
  boundsRef.current = bounds;

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const area = boundsRef.current;
      if (!enabled || !area || event.button !== 0) {
        return;
      }
      const target = event.currentTarget;
      const box = target.getBoundingClientRect();
      sizeRef.current = { width: box.width, height: box.height };
      const start: Anchor = { x: box.left + box.width / 2, bottom: box.bottom };
      const originX = event.clientX;
      const originY = event.clientY;
      const pointerId = event.pointerId;
      let moved = false;
      let latest = start;

      const onMove = (move: PointerEvent) => {
        const dx = move.clientX - originX;
        const dy = move.clientY - originY;
        if (!moved) {
          if (Math.hypot(dx, dy) < DRAG_THRESHOLD) {
            return;
          }
          moved = true;
          target.setPointerCapture(pointerId);
          setDragging(true);
        }
        latest = clampAnchor({ x: start.x + dx, bottom: start.bottom + dy }, area, sizeRef.current);
        setSaved(latest);
      };
      const onEnd = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
        if (!moved) {
          return;
        }
        swallowClick.current = true;
        setDragging(false);
        try {
          window.localStorage.setItem(KRAFT_BAR_ANCHOR_KEY, JSON.stringify(latest));
        } catch {
          // storage blocked: the spot lasts for this page view
        }
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onEnd);
      window.addEventListener("pointercancel", onEnd);
    },
    [enabled],
  );

  const onClickCapture = useCallback((event: React.MouseEvent) => {
    if (swallowClick.current) {
      swallowClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  }, []);

  return { anchor, bounds, dragging, handlers: { onPointerDown, onClickCapture } };
}
