"use client";

import type { SaveStatus } from "@/lib/documents/editor/autosave-queue";
import { cn } from "@/lib/utils";

export function SaveIndicator({ status, error, onRetry }: { status: SaveStatus; error: string | null; onRetry: () => void }) {
  if (status === "error") {
    return (
      <span role="status" className="flex items-center gap-1.5 text-[12px] text-[var(--danger)]">
        <span aria-hidden className="size-1.5 rounded-full bg-[var(--danger)]" />
        {error ? `Couldn't save: ${error}` : "Couldn't save"}
        <button type="button" onClick={onRetry} className="font-medium underline-offset-2 hover:underline">Retry</button>
      </span>
    );
  }
  const saving = status === "saving";
  return (
    <span role="status" aria-live="polite" className="flex items-center gap-1.5 text-[12px] text-[var(--fg-3)]">
      <span aria-hidden className={cn("size-1.5 rounded-full", saving ? "animate-pulse bg-[var(--warning)]" : "bg-[var(--success)]")} />
      {saving ? "Saving…" : "Saved"}
    </span>
  );
}
