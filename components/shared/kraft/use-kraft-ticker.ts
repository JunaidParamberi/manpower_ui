"use client";

import { useEffect, useRef } from "react";

/**
 * One shared `requestAnimationFrame` loop for every live Kraft face, so ten
 * faces on screen cost one rAF, not ten. The loop runs only while at least
 * one face is subscribed and the tab is visible. It also tracks the pointer
 * once for all faces (cursor-following eyes) and the last pointer/keyboard
 * activity.
 */

type TickCallback = (nowMs: number, dtMs: number) => void;

const subscribers = new Set<TickCallback>();
let frame: number | null = null;
let lastFrameAt: number | null = null;
let listening = false;

let pointer: { x: number; y: number } | null = null;
let lastActivityAt = 0;
let scrollEpoch = 0;

function loop(now: number): void {
  const dt = lastFrameAt === null ? 1000 / 60 : Math.min(100, now - lastFrameAt);
  lastFrameAt = now;
  subscribers.forEach((callback) => callback(now, dt));
  frame = window.requestAnimationFrame(loop);
}

function start(): void {
  if (frame !== null || subscribers.size === 0 || document.hidden) {
    return;
  }
  lastFrameAt = null;
  frame = window.requestAnimationFrame(loop);
}

function stop(): void {
  if (frame !== null) {
    window.cancelAnimationFrame(frame);
    frame = null;
  }
}

function onVisibilityChange(): void {
  if (document.hidden) {
    stop();
  } else {
    start();
  }
}

function onPointerMove(event: PointerEvent): void {
  pointer = { x: event.clientX, y: event.clientY };
  lastActivityAt = performance.now();
}

function onScroll(): void {
  scrollEpoch += 1;
}

function ensureListeners(): void {
  if (listening) {
    return;
  }
  listening = true;
  lastActivityAt = performance.now();
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true, capture: true });
}

export function subscribeKraftTicker(callback: TickCallback): () => void {
  ensureListeners();
  subscribers.add(callback);
  start();
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      stop();
    }
  };
}

/** Latest pointer position in client coordinates, or `null` before the first move. */
export function getKraftPointer(): { x: number; y: number } | null {
  return pointer;
}

/** `performance.now()` of the last pointer move seen by the ticker. */
export function getKraftPointerActivityAt(): number {
  return lastActivityAt;
}

/** Bumps on every scroll anywhere on the page — faces re-measure their rect when it changes. */
export function getKraftScrollEpoch(): number {
  return scrollEpoch;
}

/**
 * Subscribes `callback` to the shared ticker while `enabled`. The latest
 * callback is always used, so it may close over fresh props.
 */
export function useKraftTicker(callback: TickCallback, enabled: boolean): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    return subscribeKraftTicker((now, dt) => callbackRef.current(now, dt));
  }, [enabled]);
}
