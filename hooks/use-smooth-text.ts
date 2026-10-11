"use client";

import { useEffect, useRef, useState } from "react";

import { nextRevealLength } from "@/lib/ai-panel/smooth-reveal";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Releases streamed text at a steady, word-aligned pace (see
 * `lib/ai-panel/smooth-reveal.ts`) instead of painting each network chunk
 * the moment it lands. Text that was already complete when the component
 * mounted (history) shows at once, and so does everything under
 * `prefers-reduced-motion`.
 */
export function useSmoothText(text: string, streaming: boolean): string {
  const [shown, setShown] = useState(() => (streaming ? 0 : text.length));
  // A retry clears the turn's text; start the reveal over with it.
  if (text.length < shown) {
    setShown(0);
  }

  const shownRef = useRef(shown);
  shownRef.current = Math.min(shown, text.length);
  const inputRef = useRef({ text, streaming });
  inputRef.current = { text, streaming };

  const behind = shown < text.length;

  useEffect(() => {
    if (!behind) {
      return;
    }
    if (prefersReducedMotion()) {
      setShown(inputRef.current.text.length);
      return;
    }
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const { text: current, streaming: live } = inputRef.current;
      const next = nextRevealLength(current, shownRef.current, now - last, live);
      last = now;
      if (next !== shownRef.current) {
        shownRef.current = next;
        setShown(next);
      }
      if (next < current.length) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [behind]);

  return text.slice(0, shown);
}
