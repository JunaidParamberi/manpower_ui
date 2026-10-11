"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createAutosaveQueue, type AutosaveQueue, type SaveStatus } from "@/lib/documents/editor/autosave-queue";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";

/** One autosave queue per document page. Warns before the tab closes while writes are in flight. */
export function useDocumentAutosave(): { queue: AutosaveQueue; status: SaveStatus; error: string | null } {
  const [queue] = useState(() => createAutosaveQueue());
  useEffect(() => () => queue.dispose(), [queue]);
  const status = useSyncExternalStore(queue.subscribe, queue.getStatus, () => "idle" as SaveStatus);
  const error = useSyncExternalStore(queue.subscribe, queue.getError, () => null);
  useUnsavedChangesWarning(status === "saving" || queue.hasPending());
  return { queue, status, error };
}
