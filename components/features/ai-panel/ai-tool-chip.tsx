"use client";

import { AIThinking } from "@/components/shared/ai-thinking";

type AiToolChipProps = {
  label: string;
};

/**
 * In-flight indicator shown while the assistant runs a tool. Uses
 * <AIThinking> rather than a spinner, per the design system's rule that AI
 * work never shows a generic loader.
 */
export function AiToolChip({ label }: AiToolChipProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2">
      <AIThinking label={label} />
    </div>
  );
}
