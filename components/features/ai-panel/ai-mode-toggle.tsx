"use client";

import { cn } from "@/lib/utils";
import type { AiPanelMode } from "@/lib/ai-panel/types";

type AiModeToggleProps = {
  mode: AiPanelMode;
  onChange: (mode: AiPanelMode) => void;
};

/**
 * Ask (read-only) / Agent (read and write) switch. Shared by the desktop rail
 * and the mobile sheet — the mobile panel previously had no toggle at all,
 * which left mode unchangeable on a phone.
 */
export function AiModeToggle({ mode, onChange }: AiModeToggleProps) {
  return (
    <div className="flex items-center rounded-md bg-[var(--bg-surface)] p-[3px]">
      <button
        type="button"
        aria-pressed={mode === "ask"}
        onClick={() => onChange("ask")}
        title="Ask mode answers questions but never changes your data"
        className={cn(
          "rounded-sm px-2 py-1 text-xs font-medium transition-colors",
          mode === "ask"
            ? "bg-[var(--bg-canvas)] text-foreground shadow-xs"
            : "text-[var(--fg-3)] hover:text-foreground",
        )}
      >
        Ask
      </button>
      <button
        type="button"
        aria-pressed={mode === "agent"}
        onClick={() => onChange("agent")}
        title="Agent mode can create and change your data"
        className={cn(
          "rounded-sm px-2 py-1 text-xs font-medium transition-colors",
          mode === "agent"
            ? "bg-[var(--bg-canvas)] text-foreground shadow-xs"
            : "text-[var(--fg-3)] hover:text-foreground",
        )}
      >
        Agent
      </button>
    </div>
  );
}
