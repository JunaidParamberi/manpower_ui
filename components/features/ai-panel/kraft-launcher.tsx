"use client";

import { useEffect, useRef, useState } from "react";

import { AiPanelBody } from "@/components/features/ai-panel/ai-panel-body";
import { KraftDrawer } from "@/components/features/ai-panel/kraft-drawer";
import { KraftPeek } from "@/components/features/ai-panel/kraft-peek";
import { KraftPill } from "@/components/features/ai-panel/kraft-pill";
import { useAiPanel } from "@/lib/ai-panel/context";
import { KraftMascotProvider } from "@/lib/ai-panel/kraft-mascot-context";
import { useKraftController } from "@/hooks/use-kraft-controller";
import { useKraftSound } from "@/hooks/use-kraft-sound";
import { useResolveConfirm } from "@/hooks/use-resolve-confirm";
import { useBarPosition } from "@/hooks/use-bar-position";
import { useIsMobile } from "@/hooks/use-mobile";
import { cardShift } from "@/lib/kraft/island-geometry";
import { cn } from "@/lib/utils";

/** Default spot: bottom-centre of the page area (desktop) or above the tab bar (mobile). */
const BAR_HOME =
  "inset-x-0 mx-auto bottom-5 md:left-[var(--kraft-left,0px)] max-md:bottom-[calc(var(--tab-h)+env(safe-area-inset-bottom)+12px)]";
/** Where the user dragged it: `--bar-x` is its centre, `--bar-y` its bottom edge. */
const BAR_PLACED =
  "md:inset-x-auto md:bottom-auto md:mx-0 md:left-[var(--bar-x)] md:top-[var(--bar-y)] md:-translate-x-1/2 md:-translate-y-full";
/** Matches `KraftPeek`'s width, so it can be slid back inside the page area. */
const PEEK_WIDTH = 380;

/**
 * Kraft's single mount point inside the dashboard shell: the island bar,
 * the peek card and the panel. It is the one place that reads the panel's open state and
 * runs the mascot controller, so each event plays its sound once (not once
 * per face) and every live face shares one emotion.
 *
 * Desktop and mobile, island and docked, all share the same panel
 * instance (it restyles itself with CSS), so switching layout or crossing
 * the breakpoint never remounts the thread or aborts a running stream.
 */
type KraftLauncherProps = {
  /** Left edge of the page area (the sidebar's width), so the island stays clear of it. */
  pageLeft?: number;
};

export function KraftLauncher({ pageLeft = 0 }: KraftLauncherProps) {
  const { isOpen, open, close, turns, docked, setDocked, inlineTurnId } = useAiPanel();
  const resolveConfirm = useResolveConfirm();
  const isMobile = useIsMobile();
  const bar = useBarPosition(!isMobile, pageLeft);
  const peekShift = bar.anchor && bar.bounds ? cardShift(bar.anchor.x, PEEK_WIDTH, bar.bounds) : 0;
  const { play } = useKraftSound();
  const mascot = useKraftController({ turns, drawerOpen: isOpen, play });

  const pillRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Where focus last landed. Making the drawer `inert` on close already
  // blurs anything inside it, so by the time the close effect runs we can't
  // ask `document.activeElement`.
  const focusInDrawer = useRef(false);
  useEffect(() => {
    const track = (event: Event) => {
      focusInDrawer.current = drawerRef.current?.contains(event.target as Node) ?? false;
    };
    document.addEventListener("focusin", track);
    document.addEventListener("pointerdown", track);
    return () => {
      document.removeEventListener("focusin", track);
      document.removeEventListener("pointerdown", track);
    };
  }, []);

  // Open/close sound, focus handoff. Driven by state (not click handlers) so
  // ⌘J, "Ask AI" buttons and suggestion clicks all behave the same.
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    if (wasOpen.current === isOpen) {
      return;
    }
    wasOpen.current = isOpen;

    if (isOpen) {
      // Opening to an idle Kraft greets you (with its own soft chime); only
      // play the drawer swoosh when there's no greet, so it's one sound per moment.
      if (mascot.pillState !== "idle") {
        play("open");
      }
      const textarea = drawerRef.current?.querySelector("textarea");
      textarea?.focus({ preventScroll: true });
      return;
    }

    play("close");
    if (focusInDrawer.current) {
      focusInDrawer.current = false;
      pillRef.current?.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // A paused write peeks out of the bar while the chat is closed, unless
  // the user waved that particular one away.
  // A confirm already showing in a record page's Kraft popover isn't offered twice.
  const waiting =
    [...turns].reverse().find((turn) => turn.pendingConfirm !== null && turn.id !== inlineTurnId) ?? null;
  const [dismissedConfirm, setDismissedConfirm] = useState<string | null>(null);
  const peekConfirm =
    !isOpen && waiting?.pendingConfirm && waiting.pendingConfirm.toolUseId !== dismissedConfirm
      ? waiting.pendingConfirm
      : null;

  return (
    <KraftMascotProvider value={mascot}>
      {/* The bar (and the peek card growing out of it) can be dragged
          anywhere in the page area; a short press still opens Kraft. */}
      <div
        {...bar.handlers}
        // Stays inline: the dragged position is live pointer state (same
        // reason as the shell grid tracks in `dashboard-shell.tsx`).
        style={
          {
            ...(bar.anchor ? { "--bar-x": `${bar.anchor.x}px`, "--bar-y": `${bar.anchor.bottom}px` } : {}),
            "--peek-shift": `${peekShift}px`,
          } as React.CSSProperties
        }
        className={cn(
          "fixed z-40 w-fit",
          BAR_HOME,
          bar.anchor && BAR_PLACED,
          !isMobile && "cursor-grab",
          bar.dragging && "cursor-grabbing select-none",
          isOpen && "pointer-events-none",
        )}
      >
        <KraftPill
          ref={pillRef}
          emotion={mascot.emotion}
          label={mascot.pillState === "idle" ? "Ask Kraft…" : mascot.statusLine}
          pillState={mascot.pillState}
          onClick={open}
          hidden={isOpen || peekConfirm !== null}
          className={cn(!isMobile && "cursor-[inherit]", bar.dragging && "shadow-[var(--shadow-pop)]")}
        />
        {peekConfirm && waiting ? (
          <KraftPeek
            key={peekConfirm.toolUseId}
            emotion={mascot.emotion}
            confirm={peekConfirm}
            onResolved={(approved, write) => resolveConfirm(waiting, approved, write)}
            onOpenChat={open}
            onDismiss={() => setDismissedConfirm(peekConfirm.toolUseId)}
            className="absolute bottom-0 left-1/2 ml-[var(--peek-shift)] -translate-x-1/2 cursor-auto"
          />
        ) : null}
      </div>
      <KraftDrawer
        ref={drawerRef}
        open={isOpen}
        docked={docked}
        onDockedChange={setDocked}
        pageLeft={pageLeft}
        onClose={close}
      >
        <AiPanelBody />
      </KraftDrawer>
    </KraftMascotProvider>
  );
}
