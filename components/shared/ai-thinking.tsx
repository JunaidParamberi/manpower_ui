"use client";

import { AiIcon } from "@/components/shared/ai-icon";
import { cn } from "@/lib/utils";

type AIThinkingProps = {
  label?: string;
  size?: number;
  className?: string;
};

export function AIThinking({
  label = "Thinking",
  size = 15,
  className,
}: AIThinkingProps) {
  return (
    <div
      className={cn("ai-thinking", className)}
      role="status"
      aria-label={label}
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      <AiIcon
        size={size}
        className="ai-thinking__icon"
        style={{ color: "var(--border-focus)", flexShrink: 0 }}
      />
      <span
        className="ai-thinking__text"
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          color: "var(--fg-3)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
