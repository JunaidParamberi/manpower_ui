"use client";

import { createContext, useContext, useMemo } from "react";

import type { MascotEmotion, PillState } from "@/lib/ai-panel/mascot-state";

export type KraftMascotValue = {
  /** Kraft's current emotion — every live face follows it. */
  emotion: MascotEmotion;
  /** One-line status shared by the pill and the drawer header. */
  statusLine: string;
  pillState: PillState;
  /** True while a turn is thinking/working (status line turns accent). */
  busy: boolean;
  /** The composer reports whether it has text so Kraft can look like it's listening. */
  setComposerHasText: (hasText: boolean) => void;
};

const IDLE: KraftMascotValue = {
  emotion: "idle",
  statusLine: "Kraft",
  pillState: "idle",
  busy: false,
  setComposerHasText: () => {},
};

const KraftMascotContext = createContext<KraftMascotValue>(IDLE);

export function KraftMascotProvider({
  value,
  children,
}: {
  value: KraftMascotValue;
  children: React.ReactNode;
}) {
  const memo = useMemo(
    () => value,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value.emotion, value.statusLine, value.pillState, value.busy, value.setComposerHasText],
  );
  return <KraftMascotContext.Provider value={memo}>{children}</KraftMascotContext.Provider>;
}

/**
 * Kraft's live mascot state. Outside a `KraftLauncher` (Storybook, tests)
 * it reads as idle, so faces and the composer still render.
 */
export function useKraftMascot(): KraftMascotValue {
  return useContext(KraftMascotContext);
}
