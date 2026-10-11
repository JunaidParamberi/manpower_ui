"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const SIDEBAR_WIDTH_COOKIE = "shell_sidebar_w";
const AI_WIDTH_COOKIE = "shell_ai_w";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const SIDEBAR_WIDTH_DEFAULT = 240;
export const SIDEBAR_WIDTH_MIN = 200;
export const SIDEBAR_WIDTH_MAX = 360;

export const AI_WIDTH_DEFAULT = 440;
export const AI_WIDTH_MIN = 360;
export const AI_WIDTH_MAX = 720;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function writeCookie(name: string, value: number): void {
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}`;
}

type ShellLayoutContextValue = {
  sidebarWidth: number;
  aiWidth: number;
  setSidebarWidth: (width: number) => void;
  setAiWidth: (width: number) => void;
  resetSidebarWidth: () => void;
  resetAiWidth: () => void;
  isResizing: boolean;
  setIsResizing: (resizing: boolean) => void;
};

const ShellLayoutContext = createContext<ShellLayoutContextValue | null>(null);

type ShellLayoutProviderProps = {
  children: React.ReactNode;
  defaultSidebarWidth?: number;
  defaultAiWidth?: number;
};

export function ShellLayoutProvider({
  children,
  defaultSidebarWidth = SIDEBAR_WIDTH_DEFAULT,
  defaultAiWidth = AI_WIDTH_DEFAULT,
}: ShellLayoutProviderProps) {
  const [sidebarWidth, setSidebarWidthState] = useState(
    clamp(defaultSidebarWidth, SIDEBAR_WIDTH_MIN, SIDEBAR_WIDTH_MAX),
  );
  const [aiWidth, setAiWidthState] = useState(
    clamp(defaultAiWidth, AI_WIDTH_MIN, AI_WIDTH_MAX),
  );
  const [isResizing, setIsResizing] = useState(false);

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((name: string, value: number) => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => writeCookie(name, value), 200);
  }, []);

  const setSidebarWidth = useCallback(
    (width: number) => {
      const next = clamp(Math.round(width), SIDEBAR_WIDTH_MIN, SIDEBAR_WIDTH_MAX);
      setSidebarWidthState(next);
      persist(SIDEBAR_WIDTH_COOKIE, next);
    },
    [persist],
  );

  const setAiWidth = useCallback(
    (width: number) => {
      const next = clamp(Math.round(width), AI_WIDTH_MIN, AI_WIDTH_MAX);
      setAiWidthState(next);
      persist(AI_WIDTH_COOKIE, next);
    },
    [persist],
  );

  const resetSidebarWidth = useCallback(() => setSidebarWidth(SIDEBAR_WIDTH_DEFAULT), [setSidebarWidth]);
  const resetAiWidth = useCallback(() => setAiWidth(AI_WIDTH_DEFAULT), [setAiWidth]);

  const value = useMemo<ShellLayoutContextValue>(
    () => ({
      sidebarWidth,
      aiWidth,
      setSidebarWidth,
      setAiWidth,
      resetSidebarWidth,
      resetAiWidth,
      isResizing,
      setIsResizing,
    }),
    [sidebarWidth, aiWidth, setSidebarWidth, setAiWidth, resetSidebarWidth, resetAiWidth, isResizing],
  );

  return <ShellLayoutContext.Provider value={value}>{children}</ShellLayoutContext.Provider>;
}

export function useShellLayout(): ShellLayoutContextValue {
  const ctx = useContext(ShellLayoutContext);
  if (!ctx) throw new Error("useShellLayout must be used within a ShellLayoutProvider.");
  return ctx;
}
