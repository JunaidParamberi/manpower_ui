"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { pairMessagesIntoTurns } from "./pair-messages";
import { aiPanelReducer, initialAiPanelState } from "./store";
import type { AiPanelMode, AiTurn } from "./types";
import { archiveThread, clearActiveThread, setActiveThread, setThreadMode } from "@/lib/assistant/active-thread-actions";
import { getActiveThread, getLastUsedMode, listMessages, type ThreadListItem } from "@/lib/assistant/thread-queries";

/** localStorage key for whether Kraft opens docked as a side column or as the island. */
export const KRAFT_DOCKED_KEY = "kraft-docked";

type AiPanelContextValue = {
  isOpen: boolean;
  /** Docked: a column at the right that pushes the page. Otherwise the floating island. */
  docked: boolean;
  setDocked: (docked: boolean) => void;
  mode: AiPanelMode;
  threadId: string | null;
  turns: AiTurn[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setMode: (mode: AiPanelMode) => void;
  /** Adds a turn (its stream starts in the thread) and returns its id. */
  submitPrompt: (prompt: string, mode?: AiPanelMode, options?: { openPanel?: boolean }) => string;
  /**
   * A turn being shown somewhere other than the chat (Kraft's help popover
   * on a record page). The bar's peek card skips it so the same confirm
   * isn't offered twice.
   */
  inlineTurnId: string | null;
  setInlineTurnId: (id: string | null) => void;
  switchModeAndRerun: (turn: AiTurn) => void;
  updateTurn: (id: string, patch: Partial<Omit<AiTurn, "id">>) => void;
  clear: () => void;
  startNewSession: () => Promise<void>;
  openThread: (thread: ThreadListItem) => Promise<void>;
  onThreadCreated: (threadId: string, title: string) => void;
};

const AiPanelContext = createContext<AiPanelContextValue | null>(null);

export function AiPanelProvider({
  children,
  initialTurns,
}: {
  children: React.ReactNode;
  /**
   * Story/test-only seeding hook: pre-populates the thread with fixture
   * turns instead of booting empty. Never passed in app code — the real app
   * always mounts `<AiPanelProvider>` with just `children` and starts from
   * `initialAiPanelState`.
   */
  initialTurns?: AiTurn[];
}) {
  const [state, dispatch] = useReducer(
    aiPanelReducer,
    initialAiPanelState,
    (init) => (initialTurns ? { ...init, isOpen: true, turns: initialTurns } : init),
  );

  /**
   * Set as soon as the user submits anything. The rehydrate below is a
   * two-round-trip race against the user: if they type before it lands, its
   * `loadTurns` would replace the in-flight turn (killing the stream mid-
   * answer) and its `setThreadId` would point at the old thread rather than
   * the one the server just created for that prompt. Once the user has
   * interacted, the rehydrate has nothing useful left to say — drop it.
   */
  const interactedRef = useRef(false);

  // On mount: rehydrate the active thread from DB. This is client-only
  // rehydration of existing panel state (not server-component data
  // fetching), so a mount-effect is the right tool here, not a violation
  // of the "no fetch in useEffect" rule.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const active = await getActiveThread();
      if (cancelled || interactedRef.current) {
        return;
      }
      if (!active) {
        const lastMode = await getLastUsedMode();
        if (!cancelled && !interactedRef.current) {
          dispatch({ type: "setMode", mode: lastMode });
        }
        return;
      }
      const messages = await listMessages(active.threadId);
      if (cancelled || interactedRef.current) {
        return;
      }
      dispatch({ type: "setThreadId", threadId: active.threadId });
      dispatch({ type: "setMode", mode: active.mode });
      const turns: AiTurn[] = pairMessagesIntoTurns(messages, active.mode);
      if (turns.length > 0) {
        dispatch({ type: "loadTurns", turns });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Per-browser layout preference. Read after mount (Kraft always starts
  // closed, so there is nothing to lay out before this lands).
  const [docked, setDockedState] = useState(false);
  useEffect(() => {
    try {
      setDockedState(window.localStorage.getItem(KRAFT_DOCKED_KEY) === "1");
    } catch {
      // storage blocked: stay with the island
    }
  }, []);
  const setDocked = useCallback((next: boolean) => {
    setDockedState(next);
    try {
      window.localStorage.setItem(KRAFT_DOCKED_KEY, next ? "1" : "0");
    } catch {
      // storage blocked: the choice lasts for this page view
    }
  }, []);

  const [inlineTurnId, setInlineTurnId] = useState<string | null>(null);

  const open = useCallback(() => dispatch({ type: "open" }), []);
  const close = useCallback(() => dispatch({ type: "close" }), []);
  const toggle = useCallback(() => dispatch({ type: "toggle" }), []);
  const setMode = useCallback(
    (mode: AiPanelMode) => {
      // A deliberate toggle outranks the in-flight rehydrate: without this,
      // a mount-time restore landing a moment later would flip the user's
      // choice back with no feedback.
      interactedRef.current = true;
      dispatch({ type: "setMode", mode });
      if (state.threadId) {
        void setThreadMode(state.threadId, mode);
      }
    },
    [state.threadId],
  );
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const startNewSession = useCallback(async () => {
    interactedRef.current = true;
    if (state.threadId) {
      await archiveThread(state.threadId);
    }
    await clearActiveThread();
    dispatch({ type: "setThreadId", threadId: null });
    dispatch({ type: "clear" });
  }, [state.threadId]);

  const openThread = useCallback(async (thread: ThreadListItem) => {
    interactedRef.current = true;
    const messages = await listMessages(thread.threadId);
    dispatch({ type: "setThreadId", threadId: thread.threadId });
    dispatch({ type: "setMode", mode: thread.mode });
    dispatch({ type: "loadTurns", turns: pairMessagesIntoTurns(messages, thread.mode) });
    dispatch({ type: "open" });
    void setActiveThread(thread.threadId);
  }, []);

  const onThreadCreated = useCallback((threadId: string, _title: string) => {
    dispatch({ type: "setThreadId", threadId });
    void setActiveThread(threadId);
  }, []);

  const submitPrompt = useCallback(
    (prompt: string, mode?: AiPanelMode, options?: { openPanel?: boolean }) => {
      interactedRef.current = true;
      const id = crypto.randomUUID();
      dispatch({ type: "addTurn", turn: { id, prompt, mode: mode ?? state.mode }, open: options?.openPanel });
      return id;
    },
    [state.mode],
  );

  const switchModeAndRerun = useCallback(
    (turn: AiTurn) => {
      dispatch({ type: "updateTurn", id: turn.id, patch: { modeHint: null } });
      dispatch({ type: "setMode", mode: "agent" });
      if (state.threadId) {
        void setThreadMode(state.threadId, "agent");
      }
      interactedRef.current = true;
      const id = crypto.randomUUID();
      dispatch({ type: "addTurn", turn: { id, prompt: turn.prompt, mode: "agent" } });
    },
    [state.threadId],
  );

  const updateTurn = useCallback(
    (id: string, patch: Partial<Omit<AiTurn, "id">>) => {
      dispatch({ type: "updateTurn", id, patch });
    },
    [],
  );

  const value = useMemo<AiPanelContextValue>(
    () => ({
      isOpen: state.isOpen,
      docked,
      setDocked,
      mode: state.mode,
      threadId: state.threadId,
      turns: state.turns,
      open,
      close,
      toggle,
      setMode,
      submitPrompt,
      inlineTurnId,
      setInlineTurnId,
      switchModeAndRerun,
      updateTurn,
      clear,
      startNewSession,
      openThread,
      onThreadCreated,
    }),
    [
      state.isOpen,
      docked,
      setDocked,
      state.mode,
      state.threadId,
      state.turns,
      open,
      close,
      toggle,
      setMode,
      submitPrompt,
      inlineTurnId,
      switchModeAndRerun,
      updateTurn,
      clear,
      startNewSession,
      openThread,
      onThreadCreated,
    ],
  );

  return <AiPanelContext.Provider value={value}>{children}</AiPanelContext.Provider>;
}

/** Like useAiPanel, but null outside a provider (Storybook, pages without Kraft). */
export function useOptionalAiPanel(): AiPanelContextValue | null {
  return useContext(AiPanelContext);
}

export function useAiPanel(): AiPanelContextValue {
  const ctx = useContext(AiPanelContext);
  if (!ctx) {
    throw new Error("useAiPanel must be used within an AiPanelProvider");
  }
  return ctx;
}
