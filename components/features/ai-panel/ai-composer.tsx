"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAiPanel } from "@/lib/ai-panel/context";
import { useKraftMascot } from "@/lib/ai-panel/kraft-mascot-context";

/**
 * Pinned prompt composer for the AI panel. Auto-grows with content, submits
 * on `Enter` (or the send button) and newlines on `Shift+Enter`, and disables
 * itself while the latest turn is still streaming (there's one active
 * request at a time).
 */
export function AiComposer() {
  const { turns, submitPrompt } = useAiPanel();
  const { setComposerHasText } = useKraftMascot();
  const [value, setValue] = useState("");
  const hasText = value.trim().length > 0;

  // Kraft looks attentive ("listening") while there's a draft in the box.
  useEffect(() => {
    setComposerHasText(hasText);
  }, [hasText, setComposerHasText]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isStreaming = useMemo(() => {
    const latest = turns[turns.length - 1];
    return latest?.status === "streaming";
  }, [turns]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (trimmed.length === 0 || isStreaming) {
      return;
    }
    submitPrompt(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(event.target.value);
    const el = event.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg-surface)] p-3">
      <div
        className={cn(
          "flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-canvas)] py-1.5 pr-1.5 pl-3",
          "transition-[border-color,box-shadow] duration-150",
          "focus-within:border-[var(--border-focus)] focus-within:ring-3 focus-within:ring-[var(--accent-ring)]",
          isStreaming && "opacity-70",
        )}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isStreaming ? "Kraft is working…" : "Give me a task…"}
          aria-label="Message Kraft"
          disabled={isStreaming}
          rows={1}
          className="max-h-40 min-h-8 flex-1 resize-none overflow-y-auto rounded-none border-0 bg-transparent px-0 py-1.5 text-sm leading-5 shadow-none focus-visible:border-0 focus-visible:ring-0 disabled:opacity-100 dark:bg-transparent"
        />
        <Button
          type="button"
          size="icon"
          aria-label="Send"
          disabled={isStreaming || !hasText}
          onClick={handleSubmit}
          className="size-8 rounded-lg"
        >
          <ArrowUp className="size-4" strokeWidth={2} />
        </Button>
      </div>
      <p className="mt-1.5 hidden px-1 text-[11px] text-[var(--fg-3)] md:block">
        <kbd className="font-[family-name:var(--font-body)]">Enter</kbd> to send ·{" "}
        <kbd className="font-[family-name:var(--font-body)]">Shift + Enter</kbd> for a new line
      </p>
    </div>
  );
}
