"use client";

import { createContext, useCallback, useContext, useRef, useState, useEffect } from "react";

import { isGlowing } from "@/lib/ai-panel/glow-state";

const GLOW_DURATION_MS = 1500;

type ActivityKey = string;

function activityKey(entity: string, entityId: string): ActivityKey {
  return `${entity}:${entityId}`;
}

type AgentActivityContextValue = {
  publish: (entity: string, entityId: string) => void;
  subscribe: (key: ActivityKey, callback: () => void) => () => void;
  lastPublishedAt: (key: ActivityKey) => number | null;
};

const AgentActivityContext = createContext<AgentActivityContextValue | null>(null);

/**
 * Publishes "this entity/id was just written by the agent" events and lets
 * `useAgentGlow` subscribe to a single key. Listener storage is a plain Map
 * of Sets kept in refs (not React state) so a publish only re-renders the
 * specific row components that are listening for that key — not the whole
 * provider subtree.
 */
export function AgentActivityProvider({ children }: { children: React.ReactNode }) {
  const timestamps = useRef(new Map<ActivityKey, number>());
  const listeners = useRef(new Map<ActivityKey, Set<() => void>>());

  const publish = useCallback((entity: string, entityId: string) => {
    const key = activityKey(entity, entityId);
    timestamps.current.set(key, Date.now());
    listeners.current.get(key)?.forEach((callback) => callback());
  }, []);

  const subscribe = useCallback((key: ActivityKey, callback: () => void) => {
    let set = listeners.current.get(key);
    if (!set) {
      set = new Set();
      listeners.current.set(key, set);
    }
    set.add(callback);
    return () => {
      set?.delete(callback);
    };
  }, []);

  const lastPublishedAt = useCallback((key: ActivityKey) => {
    return timestamps.current.get(key) ?? null;
  }, []);

  return (
    <AgentActivityContext.Provider value={{ publish, subscribe, lastPublishedAt }}>
      {children}
    </AgentActivityContext.Provider>
  );
}

function useAgentActivity(): AgentActivityContextValue {
  const ctx = useContext(AgentActivityContext);
  if (!ctx) {
    throw new Error("useAgentGlow must be used within an AgentActivityProvider");
  }
  return ctx;
}

/**
 * True for `GLOW_DURATION_MS` after the agent creates/updates this exact
 * entity/id, then false again. Call unconditionally per row — cheap when
 * nothing is glowing (one Map lookup, no timers running).
 */
export function useAgentGlow(entity: string, entityId: string): boolean {
  const { subscribe, lastPublishedAt } = useAgentActivity();
  const key = activityKey(entity, entityId);
  const [glowing, setGlowing] = useState(() => isGlowing(lastPublishedAt(key), Date.now(), GLOW_DURATION_MS));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setGlowing(isGlowing(lastPublishedAt(key), Date.now(), GLOW_DURATION_MS));

    const unsubscribe = subscribe(key, () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setGlowing(true);
      timerRef.current = setTimeout(() => {
        setGlowing(false);
        timerRef.current = null;
      }, GLOW_DURATION_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return glowing;
}

/** For components that need to publish directly (the SSE-stream hook). */
export function useAgentActivityPublish(): (entity: string, entityId: string) => void {
  return useAgentActivity().publish;
}
