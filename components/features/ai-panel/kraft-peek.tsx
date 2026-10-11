"use client";

import { X } from "lucide-react";

import { AiConfirmCard } from "@/components/features/ai-panel/ai-confirm-card";
import { KraftFace } from "@/components/shared/kraft/kraft-face";
import { cn } from "@/lib/utils";
import type { MascotEmotion } from "@/lib/ai-panel/mascot-state";
import type { ConfirmEvent } from "@/lib/assistant/stream-events";

type KraftPeekProps = {
  emotion: MascotEmotion;
  confirm: ConfirmEvent;
  onResolved: (approved: boolean, write: { entity: string; entityId: string | null } | null) => void;
  /** Opens the full chat (to read the conversation before deciding). */
  onOpenChat: () => void;
  /** Folds the card back into the bar without answering. */
  onDismiss: () => void;
  className?: string;
};

/**
 * Kraft's peek: when a paused write needs the user while the chat is
 * closed, the bar grows into this small card so they can confirm or cancel
 * in place, without opening the chat. Uses the same `AiConfirmCard` as the
 * thread, so both resolve the same server-side action.
 */
export function KraftPeek({ emotion, confirm, onResolved, onOpenChat, onDismiss, className }: KraftPeekProps) {
  return (
    <div
      role="dialog"
      aria-label="Kraft needs your OK"
      className={cn(
        "kraft-peek w-[min(380px,calc(100vw-32px))] rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-2 shadow-[var(--shadow-pop)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 py-1 pr-1 pl-1.5">
        <KraftFace emotion={emotion} size={26} />
        <p className="min-w-0 flex-1 text-[13px] font-semibold text-foreground">Kraft needs your OK</p>
        <button
          type="button"
          onClick={onOpenChat}
          className="rounded-md px-2 py-1 text-xs font-medium text-[var(--fg-2)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-ring)]"
        >
          Open chat
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Hide for now"
          className="flex size-7 items-center justify-center rounded-md text-[var(--fg-3)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-ring)]"
        >
          <X size={14} strokeWidth={1.8} aria-hidden />
        </button>
      </div>
      <AiConfirmCard confirm={confirm} onResolved={onResolved} />
    </div>
  );
}
