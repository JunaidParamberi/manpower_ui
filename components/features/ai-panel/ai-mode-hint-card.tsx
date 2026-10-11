"use client";

import { Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ModeHintEvent } from "@/lib/assistant/stream-events";

type AiModeHintCardProps = {
  hint: ModeHintEvent;
  /** True while any turn is streaming — one request at a time. */
  disabled: boolean;
  onSwitch: () => void;
};

/**
 * Shown when the user asked for a write while the panel was in read-only Ask
 * mode. The assistant explains in prose alongside this; the card carries the
 * action it would take and the one click that switches mode and re-runs the
 * same prompt.
 */
export function AiModeHintCard({ hint, disabled, onSwitch }: AiModeHintCardProps) {
  return (
    <div className="rounded-lg border border-primary/40 bg-[var(--bg-surface)] px-3 py-3">
      <div className="flex items-start gap-2">
        <Zap
          className="mt-0.5 size-4 shrink-0 text-primary"
          strokeWidth={1.6}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[var(--fg-3)]">Needs Agent mode</p>
          <p className="mt-0.5 text-sm text-foreground">{hint.action}</p>
          <div className="mt-3">
            <Button size="sm" disabled={disabled} onClick={onSwitch}>
              Switch to Agent &amp; run
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
