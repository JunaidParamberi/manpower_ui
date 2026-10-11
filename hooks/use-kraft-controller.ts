"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  deriveMascotEmotion,
  hasPendingTimer,
  isBusyEmotion,
  mascotStatusLine,
  pillStateFor,
  type MascotEmotion,
  type MascotStateInput,
} from "@/lib/ai-panel/mascot-state";
import type { KraftMascotValue } from "@/lib/ai-panel/kraft-mascot-context";
import { countDoneSteps } from "@/lib/ai-panel/trail-steps";
import type { AiTurn } from "@/lib/ai-panel/types";
import { soundForTransition, type KraftSound } from "@/lib/kraft/sounds";

const TICK_MS = 250;

type Options = {
  turns: AiTurn[];
  drawerOpen: boolean;
  play: (sound: KraftSound) => void;
};

/**
 * Kraft's controller: turns panel state + elapsed time into one emotion,
 * and plays the matching sound exactly once per change. Only the launcher
 * calls this. Time-based branches (success → proud → idle, greet, the
 * mid-run "found something" flash, dozing off) re-derive on a 250ms
 * interval that stops while Kraft is asleep; the emotion state only
 * updates when it actually changes, so the tick never re-renders the thread.
 *
 * Turns restored from history are ignored: Kraft only reacts to turns that
 * streamed in this session, so a page load never greets you with an old
 * error.
 */
export function useKraftController({ turns, drawerOpen, play }: Options): KraftMascotValue {
  const [composerHasText, setComposerHasTextState] = useState(false);
  const [emotion, setEmotion] = useState<MascotEmotion>("idle");

  const latest = turns.length > 0 ? turns[turns.length - 1] : null;

  const liveTurnIds = useRef(new Set<string>());
  const turnDoneAt = useRef<{ id: string; at: number } | null>(null);
  const stepResolved = useRef<{ id: string; count: number; at: number | null }>({ id: "", count: 0, at: null });
  const drawerOpenedAt = useRef<number | null>(null);
  const lastActivityAt = useRef(0);
  const wokeAt = useRef<number | null>(null);
  const emotionRef = useRef<MascotEmotion>("idle");
  const inputsRef = useRef({ latest, drawerOpen, composerHasText });
  inputsRef.current = { latest, drawerOpen, composerHasText };

  // Track the latest turn's lifecycle: streaming → done, and steps resolving.
  if (latest) {
    if (latest.status === "streaming") {
      liveTurnIds.current.add(latest.id);
    }
    if (latest.status !== "done" && turnDoneAt.current?.id === latest.id) {
      turnDoneAt.current = null; // retried
    }
    if (
      latest.status === "done" &&
      liveTurnIds.current.has(latest.id) &&
      turnDoneAt.current?.id !== latest.id
    ) {
      turnDoneAt.current = { id: latest.id, at: performance.now() };
    }
    const doneCount = countDoneSteps(latest.steps);
    if (stepResolved.current.id !== latest.id) {
      stepResolved.current = { id: latest.id, count: doneCount, at: null };
    } else if (doneCount > stepResolved.current.count) {
      stepResolved.current = { id: latest.id, count: doneCount, at: performance.now() };
    } else if (doneCount < stepResolved.current.count) {
      stepResolved.current = { id: latest.id, count: doneCount, at: null };
    }
  }

  const buildInput = useCallback((now: number): MascotStateInput => {
    const { latest: turn, drawerOpen: open, composerHasText: hasText } = inputsRef.current;
    const live = turn && liveTurnIds.current.has(turn.id) ? turn : null;
    const done = turnDoneAt.current;
    const step = stepResolved.current;
    return {
      latestTurn: live,
      composerHasText: hasText,
      drawerOpen: open,
      msSinceTurnDone: live && done?.id === live.id ? now - done.at : null,
      msSinceLastActivity: now - lastActivityAt.current,
      msSinceDrawerOpened: open && drawerOpenedAt.current !== null ? now - drawerOpenedAt.current : null,
      msSinceStepResolved: live && step.id === live.id && step.at !== null ? now - step.at : null,
      msSinceWoke: wokeAt.current === null ? null : now - wokeAt.current,
    };
  }, []);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recompute = useCallback(() => {
    const now = performance.now();
    const input = buildInput(now);
    const next = deriveMascotEmotion(input);
    emotionRef.current = next;
    setEmotion(next);
    if (!hasPendingTimer(input) && intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [buildInput]);

  const ensureTicking = useCallback(() => {
    if (intervalRef.current === null) {
      intervalRef.current = setInterval(recompute, TICK_MS);
    }
  }, [recompute]);

  // Drawer open timestamp drives the greet.
  useEffect(() => {
    drawerOpenedAt.current = drawerOpen ? performance.now() : null;
  }, [drawerOpen]);

  // Re-derive whenever panel state changes, and keep the clock running.
  useEffect(() => {
    recompute();
    ensureTicking();
  }, [latest, drawerOpen, composerHasText, recompute, ensureTicking]);

  // Pointer/keyboard activity keeps Kraft awake; activity while asleep wakes it.
  useEffect(() => {
    lastActivityAt.current = performance.now();
    const onActivity = () => {
      const now = performance.now();
      if (emotionRef.current === "sleepy") {
        wokeAt.current = now;
      }
      lastActivityAt.current = now;
      if (emotionRef.current === "sleepy") {
        recompute();
      }
      ensureTicking();
    };
    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    return () => {
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [recompute, ensureTicking]);

  // One sound per change of emotion (plus a soft tick per new tool).
  const toolStarts = latest && liveTurnIds.current.has(latest.id) ? latest.steps.length : 0;
  const soundState = useRef({ emotion: "idle" as MascotEmotion, toolStarts: 0 });
  useEffect(() => {
    const prev = soundState.current;
    const sound = soundForTransition(prev.emotion, emotion, {
      drawerOpen: inputsRef.current.drawerOpen,
      prevToolStarts: prev.toolStarts,
      nextToolStarts: toolStarts,
    });
    soundState.current = { emotion, toolStarts };
    if (sound) {
      play(sound);
    }
  }, [emotion, toolStarts, play]);

  const setComposerHasText = useCallback((hasText: boolean) => {
    setComposerHasTextState(hasText);
  }, []);

  const streaming = latest?.status === "streaming";
  return {
    emotion,
    statusLine: mascotStatusLine(emotion, latest?.activeTool ?? null),
    pillState: pillStateFor(emotion, streaming),
    busy: isBusyEmotion(emotion) && streaming,
    setComposerHasText,
  };
}
