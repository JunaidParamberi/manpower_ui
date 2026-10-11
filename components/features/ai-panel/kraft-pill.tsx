"use client";

import { forwardRef, useEffect, useState } from "react";

import { KraftFace } from "@/components/shared/kraft/kraft-face";
import { cn } from "@/lib/utils";
import type { MascotEmotion, PillState } from "@/lib/ai-panel/mascot-state";

const COLLAPSE_AFTER_MS = 5000;

type KraftPillProps = {
  emotion: MascotEmotion;
  /** Kraft's status line; "Kraft" while idle. */
  label: string;
  pillState: PillState;
  onClick: () => void;
  /** Fades and drops out of the way while the drawer is open. */
  hidden?: boolean;
  /** Start collapsed to the face (stories). The pill also collapses itself after 5s idle. */
  defaultCollapsed?: boolean;
  className?: string;
};

const LABEL_TONE: Record<PillState, string> = {
  idle: "text-foreground",
  busy: "text-[var(--fg-2)]",
  confirm: "text-[var(--warning)]",
  done: "text-[var(--success)]",
  error: "text-[var(--danger)]",
};

/**
 * Kraft's floating entry point. Shows the live face and a one-line status
 * so work stays visible while the drawer is closed; idle it shrinks to just
 * the face after 5s and expands again on hover or focus.
 */
export const KraftPill = forwardRef<HTMLButtonElement, KraftPillProps>(function KraftPill(
  { emotion, label, pillState, onClick, hidden = false, defaultCollapsed = false, className },
  ref,
) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (pillState !== "idle") {
      setCollapsed(false);
      return;
    }
    if (hovered) {
      return;
    }
    const timer = setTimeout(() => setCollapsed(true), COLLAPSE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [pillState, hovered]);

  const isCollapsed = collapsed && !hovered && pillState === "idle";

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerEnter={() => {
        setHovered(true);
        setCollapsed(false);
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setCollapsed(false)}
      aria-label={pillState === "idle" ? "Open Kraft (⌘J)" : `Open Kraft: ${label}`}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      data-pill={pillState}
      className={cn(
        "kraft-pill group/pill relative inline-flex h-11 items-center overflow-hidden whitespace-nowrap rounded-full",
        "border border-[var(--border)] bg-[var(--bg-surface)] text-[13px] font-medium shadow-[var(--shadow-md)]",
        "transition-[padding,gap,opacity,translate,box-shadow,border-color] duration-200 ease-[var(--ease-out)]",
        "hover:-translate-y-px hover:shadow-[var(--shadow-pop)]",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-ring)]",
        isCollapsed ? "gap-0 pr-1.5 pl-1.5" : "gap-2 pr-3.5 pl-1.5",
        pillState === "confirm" &&
          "border-[var(--warning)] shadow-[0_0_0_3px_var(--warning-soft),var(--shadow-md)]",
        hidden && "pointer-events-none translate-y-3 opacity-0",
        className,
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center">
        <KraftFace emotion={emotion} size={30} />
      </span>
      <span
        className={cn(
          "overflow-hidden text-ellipsis transition-[max-width,opacity] duration-300 ease-[var(--ease-out)]",
          LABEL_TONE[pillState],
          isCollapsed ? "max-w-0 opacity-0" : "max-w-[220px] opacity-100",
        )}
      >
        {label}
      </span>
      {pillState === "idle" && !isCollapsed ? (
        <kbd
          aria-hidden
          className="rounded border border-[var(--border)] px-[5px] font-[family-name:var(--font-body)] text-[10.5px] text-[var(--fg-3)] opacity-0 transition-opacity group-hover/pill:opacity-100 group-focus-visible/pill:opacity-100"
        >
          ⌘J
        </kbd>
      ) : null}
      {pillState === "busy" ? (
        <span
          aria-hidden
          className="kraft-pill__bar absolute right-3.5 bottom-1.5 left-11 h-0.5 overflow-hidden rounded-full bg-[var(--accent-soft-2)]"
        />
      ) : null}
    </button>
  );
});
