"use client";

import { useCallback, useRef } from "react";

import { cn } from "@/lib/utils";

type ShellResizeHandleProps = {
  /** Which side of the panel this handle sits on — controls drag-delta sign. */
  edge: "left" | "right";
  width: number;
  min: number;
  max: number;
  onResize: (width: number) => void;
  onReset: () => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  label: string;
  className?: string;
};

const STEP = 16;

export function ShellResizeHandle({
  edge,
  width,
  min,
  max,
  onResize,
  onReset,
  onResizeStart,
  onResizeEnd,
  label,
  className,
}: ShellResizeHandleProps) {
  const startX = useRef(0);
  const startWidth = useRef(0);
  const sign = edge === "left" ? 1 : -1;

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const delta = (e.clientX - startX.current) * sign;
      onResize(startWidth.current + delta);
    },
    [onResize, sign],
  );

  const onPointerUp = useCallback(() => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
    onResizeEnd?.();
  }, [onPointerMove, onResizeEnd]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      startX.current = e.clientX;
      startWidth.current = width;
      onResizeStart?.();
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp, { once: true });
    },
    [width, onPointerMove, onPointerUp, onResizeStart],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onResize(width + (edge === "left" ? -STEP : STEP));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onResize(width + (edge === "left" ? STEP : -STEP));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onReset();
      }
    },
    [edge, onResize, onReset, width],
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
      className={cn(
        "group/handle relative z-10 w-1 shrink-0 cursor-col-resize touch-none select-none",
        "focus-visible:outline-none",
        className,
      )}
    >
      <div
        className={cn(
          // Invisible at rest: the panel gap is the divider now. The line only
          // shows on hover/drag/focus as the resize affordance.
          "absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors",
          "group-hover/handle:w-0.5 group-hover/handle:bg-primary",
          "group-active/handle:w-0.5 group-active/handle:bg-primary",
          "group-focus-visible/handle:w-0.5 group-focus-visible/handle:bg-primary",
        )}
      />
    </div>
  );
}
