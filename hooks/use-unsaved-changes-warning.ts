"use client";

import { useEffect } from "react";

/** Warn on tab close / refresh when work is in flight. */
export function useUnsavedChangesWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active]);
}
