"use client";

import { forwardRef, useEffect, useRef } from "react";
import { ChevronDown, PanelRight, PictureInPicture2, Volume2, VolumeX, X } from "lucide-react";

import { AiModeToggle } from "@/components/features/ai-panel/ai-mode-toggle";
import { AiNewSessionButton } from "@/components/features/ai-panel/ai-new-session-button";
import { AiThreadHistoryMenu } from "@/components/features/ai-panel/ai-thread-history-menu";
import { ShellResizeHandle } from "@/components/layout/shell-resize-handle";
import { KraftFace } from "@/components/shared/kraft/kraft-face";
import { cn } from "@/lib/utils";
import { useAiPanel } from "@/lib/ai-panel/context";
import { useKraftMascot } from "@/lib/ai-panel/kraft-mascot-context";
import { AI_WIDTH_MAX, AI_WIDTH_MIN, useShellLayout } from "@/lib/layout/shell-layout-context";
import { useKraftSoundPrefs } from "@/hooks/use-kraft-sound";
import { useIslandGeometry } from "@/hooks/use-island-geometry";
import type { Edge } from "@/lib/kraft/island-geometry";

type KraftDrawerProps = {
  open: boolean;
  /**
   * Desktop layout. Docked: a full-height column at the right; the shell
   * reserves a grid track for it, so it pushes the page instead of covering
   * it. Otherwise: the island, a floating chat sheet centred over the page
   * just above the bottom edge. Mobile is always full screen.
   */
  docked?: boolean;
  onDockedChange?: (docked: boolean) => void;
  /**
   * Left edge of the page area (sidebar width), in px. The island can be
   * dragged and resized anywhere right of it and below the app header.
   */
  pageLeft?: number;
  onClose: () => void;
  /** The thread + composer; `AiPanelBody` in the app, a mock in stories. */
  children: React.ReactNode;
};

const iconButtonClass =
  "flex size-7 items-center justify-center rounded-md text-[var(--fg-2)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-ring)]";

/** Speaker toggle for Kraft's sounds; the preference persists per browser. */
export function KraftSoundToggle() {
  const { enabled, setEnabled } = useKraftSoundPrefs();
  const Icon = enabled ? Volume2 : VolumeX;
  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute Kraft" : "Unmute Kraft"}
      title={enabled ? "Mute Kraft" : "Unmute Kraft"}
      className={iconButtonClass}
    >
      <Icon size={16} strokeWidth={1.6} aria-hidden />
    </button>
  );
}

type KraftDrawerHeaderProps = {
  onClose: () => void;
  docked?: boolean;
  /** Omitted in stories that don't offer the layout switch. */
  onDockedChange?: (docked: boolean) => void;
  /** Island only: the header is the drag handle; double-click returns it home. */
  onDragStart?: (event: React.PointerEvent) => void;
  onResetPosition?: () => void;
};

/**
 * Header: live face, name + status, then mode, sound, history, new session,
 * the dock / pop-out switch and close. Docked it is exactly the app
 * header's height (`--topbar-h`), so the two bottom borders run as one line.
 */
export function KraftDrawerHeader({
  onClose,
  docked = false,
  onDockedChange,
  onDragStart,
  onResetPosition,
}: KraftDrawerHeaderProps) {
  const { mode, setMode } = useAiPanel();
  const { emotion, statusLine, busy } = useKraftMascot();
  const status = emotion === "idle" ? "Ready when you are" : statusLine;

  return (
    <div
      onPointerDown={onDragStart}
      onDoubleClick={(event) => {
        if (!(event.target as HTMLElement).closest("button")) {
          onResetPosition?.();
        }
      }}
      title={onDragStart ? "Drag to move · double-click to reset" : undefined}
      className={cn(
        "flex shrink-0 items-center gap-2.5 border-b border-[var(--border)] pr-2.5 pl-3",
        docked ? "h-[var(--topbar-h)]" : "h-[52px]",
        onDragStart && "md:cursor-grab md:touch-none md:select-none md:active:cursor-grabbing",
      )}
    >
      <KraftFace emotion={emotion} size={30} />
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-sm font-semibold text-foreground">Kraft</span>
        <span
          className={cn(
            "truncate text-xs transition-colors",
            busy ? "text-[var(--border-focus)]" : "text-[var(--fg-3)]",
          )}
          aria-live="polite"
        >
          {status}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <AiModeToggle mode={mode} onChange={setMode} />
        <KraftSoundToggle />
        <AiThreadHistoryMenu triggerClassName="size-7" iconSize={16} />
        <AiNewSessionButton className="size-7" iconClassName="size-4" />
        {onDockedChange ? (
          <button
            type="button"
            onClick={() => onDockedChange(!docked)}
            aria-label={docked ? "Pop Kraft out" : "Dock Kraft to the side"}
            title={docked ? "Pop out" : "Dock to the side"}
            className={cn(iconButtonClass, "max-md:hidden")}
          >
            {docked ? (
              <PictureInPicture2 size={16} strokeWidth={1.6} aria-hidden />
            ) : (
              <PanelRight size={16} strokeWidth={1.6} aria-hidden />
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          aria-label={docked ? "Close Kraft" : "Minimise Kraft"}
          title={docked ? "Close" : "Minimise"}
          className={iconButtonClass}
        >
          {docked ? (
            <X size={16} strokeWidth={1.6} aria-hidden />
          ) : (
            <>
              <ChevronDown size={16} strokeWidth={1.6} aria-hidden className="max-md:hidden" />
              <X size={16} strokeWidth={1.6} aria-hidden className="md:hidden" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Kraft's panel. Desktop: the island (a floating chat sheet, bottom centre
 * of the page area, no scrim) or, docked, a full-height column at the right
 * that the shell makes room for, resizable from its left edge. Mobile: a
 * full-screen panel that slides up. Desktop centring reads `--kraft-left`
 * (the sidebar's current width), set by the dashboard shell.
 *
 * It stays MOUNTED while closed (translated off-screen, `inert`,
 * `aria-hidden`): each turn's SSE stream lives inside `AiTurn`, so
 * unmounting would abort a running agent. That is also why this is not the
 * base-ui `Sheet`, which unmounts its content.
 */
export const KraftDrawer = forwardRef<HTMLDivElement, KraftDrawerProps>(function KraftDrawer(
  { open, docked = false, onDockedChange, pageLeft = 0, onClose, children },
  forwardedRef,
) {
  const { aiWidth, setAiWidth, resetAiWidth, setIsResizing } = useShellLayout();
  const island = useIslandGeometry(!docked, pageLeft);
  const placed = !docked && island.rect !== null;
  const localRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Esc closes while focus is inside. A native listener on purpose: React
  // events bubble through portals, so Esc in the history menu or the email
  // composer (both portalled children) would otherwise close the drawer too.
  useEffect(() => {
    const node = localRef.current;
    if (!node) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      ref={(node) => {
        localRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      }}
      role="complementary"
      aria-label="Kraft assistant"
      aria-hidden={!open || undefined}
      inert={!open}
      data-open={open}
      data-layout={docked ? "docked" : "island"}
      // Stays inline: the docked width and the island's rect are live,
      // drag-resizable state (same reason as the shell grid tracks in
      // `dashboard-shell.tsx`).
      style={
        {
          "--kraft-w": `${aiWidth}px`,
          ...(island.rect
            ? {
                "--island-x": `${island.rect.left}px`,
                "--island-y": `${island.rect.top}px`,
                "--island-w": `${island.rect.width}px`,
                "--island-h": `${island.rect.height}px`,
              }
            : {}),
        } as React.CSSProperties
      }
      className={cn(
        "fixed inset-0 z-50 flex flex-col overflow-hidden bg-[var(--bg-surface)]",
        "transition-[translate,opacity,scale] duration-[320ms] ease-[cubic-bezier(.2,.9,.3,1)] motion-reduce:transition-none",
        // Mobile: stop above the tab bar (it shares z-50 and paints later, so
        // it would otherwise cover the composer).
        "pt-[env(safe-area-inset-top)] max-md:bottom-[calc(var(--tab-h)+env(safe-area-inset-bottom))] md:pt-0",
        docked
          ? // Third panel in the shell frame: inset by the frame padding,
            // same radius/border as the sidebar and page panels.
            "md:top-2 md:right-2 md:bottom-2 md:left-auto md:w-[var(--kraft-w)] md:rounded-[var(--radius-panel)] md:border md:border-[var(--border)] md:shadow-[var(--shadow-xs)]"
          : [
              placed
                ? "md:top-[var(--island-y)] md:right-auto md:bottom-auto md:left-[var(--island-x)] md:h-[var(--island-h)] md:w-[var(--island-w)]"
                : [
                    "md:top-auto md:right-0 md:bottom-5 md:left-[var(--kraft-left,0px)] md:mx-auto",
                    "md:h-[min(600px,calc(100dvh-112px))] md:w-[min(560px,calc(100vw-var(--kraft-left,0px)-48px))]",
                  ],
              "md:origin-bottom md:rounded-2xl md:border md:border-[var(--border)] md:shadow-[var(--shadow-pop)]",
              island.interacting && "select-none md:shadow-[var(--shadow-pop),0_0_0_3px_var(--accent-ring)]",
            ],
        open
          ? "translate-x-0 translate-y-0 opacity-100"
          : docked
            ? "translate-y-[105%] md:translate-x-[105%] md:translate-y-0"
            : "translate-y-[105%] md:translate-y-3 md:scale-[0.97] md:opacity-0",
      )}
    >
      <ShellResizeHandle
        edge="right"
        width={aiWidth}
        min={AI_WIDTH_MIN}
        max={AI_WIDTH_MAX}
        onResize={setAiWidth}
        onReset={resetAiWidth}
        onResizeStart={() => setIsResizing(true)}
        onResizeEnd={() => setIsResizing(false)}
        label="Resize Kraft"
        className={cn("absolute inset-y-0 left-0 hidden -translate-x-1/2", docked && "md:block")}
      />
      {!docked ? <IslandResizeHandles onStart={island.startResize} /> : null}
      <KraftDrawerHeader
        onClose={onClose}
        docked={docked}
        onDockedChange={onDockedChange}
        onDragStart={docked ? undefined : island.startMove}
        onResetPosition={docked ? undefined : island.reset}
      />
      <div className={cn("min-h-0 flex-1", island.interacting && "pointer-events-none")}>{children}</div>
    </div>
  );
});

const EDGE_HANDLES: Array<{ edge: Edge; className: string; label: string }> = [
  { edge: "n", className: "inset-x-4 top-0 h-1.5 cursor-ns-resize", label: "top edge" },
  { edge: "s", className: "inset-x-4 bottom-0 h-1.5 cursor-ns-resize", label: "bottom edge" },
  { edge: "w", className: "inset-y-4 left-0 w-1.5 cursor-ew-resize", label: "left edge" },
  { edge: "e", className: "inset-y-4 right-0 w-1.5 cursor-ew-resize", label: "right edge" },
  { edge: "nw", className: "top-0 left-0 size-4 cursor-nwse-resize", label: "top-left corner" },
  { edge: "ne", className: "top-0 right-0 size-4 cursor-nesw-resize", label: "top-right corner" },
  { edge: "sw", className: "bottom-0 left-0 size-4 cursor-nesw-resize", label: "bottom-left corner" },
  { edge: "se", className: "right-0 bottom-0 size-4 cursor-nwse-resize", label: "bottom-right corner" },
];

/** Invisible grab strips on the island's edges and corners (desktop only). */
function IslandResizeHandles({ onStart }: { onStart: (edge: Edge) => (event: React.PointerEvent) => void }) {
  return (
    <>
      {EDGE_HANDLES.map(({ edge, className, label }) => (
        <div
          key={edge}
          aria-hidden
          title={`Resize from the ${label}`}
          onPointerDown={onStart(edge)}
          className={cn("absolute z-10 hidden touch-none md:block", className)}
        />
      ))}
    </>
  );
}
