"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { AiTurn } from "@/components/features/ai-panel/ai-turn";
import { KraftFace } from "@/components/shared/kraft/kraft-face";
import { useAiPanel } from "@/lib/ai-panel/context";
import { useKraftMascot } from "@/lib/ai-panel/kraft-mascot-context";
import { suggestionsForPath, type PageSuggestion } from "@/lib/ai-panel/suggestions";

/**
 * Kraft's empty state: a greeting that names the current page and three
 * starter prompts for it. Agent-tagged prompts switch the panel to Agent
 * mode before submitting.
 */
export function AiThreadEmpty() {
  const pathname = usePathname() ?? "/";
  const { mode, setMode, submitPrompt } = useAiPanel();
  const { emotion } = useKraftMascot();
  const { pageLabel, items } = suggestionsForPath(pathname);

  function pick(item: PageSuggestion) {
    if (item.mode !== mode) {
      setMode(item.mode);
    }
    submitPrompt(item.prompt, item.mode);
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3.5 px-4 py-6 text-center">
      <KraftFace emotion={emotion} size={80} />
      <p className="relative max-w-[30ch] rounded-xl bg-[var(--bg-subtle)] px-3.5 py-2.5 text-[13.5px] text-foreground before:absolute before:-top-1.5 before:left-1/2 before:-ml-1.5 before:border-x-[6px] before:border-b-[6px] before:border-x-transparent before:border-b-[var(--bg-subtle)] before:content-['']">
        Hey, I&apos;m Kraft. You&apos;re on <strong className="font-semibold">{pageLabel}</strong>. Want me to take
        something off your plate?
      </p>
      <p className="text-[11px] font-medium tracking-[0.08em] text-[var(--fg-3)] uppercase">Suggestions for this page</p>
      <div className="flex w-full flex-col gap-1.5">
        {items.map((item) => (
          <button
            key={item.prompt}
            type="button"
            onClick={() => pick(item)}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:border-[var(--border-focus)] hover:bg-[var(--accent-soft)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-ring)]"
          >
            <span className="min-w-0 flex-1">{item.prompt}</span>
            <small className="shrink-0 text-[11px] tracking-[0.06em] text-[var(--fg-3)] uppercase">{item.mode}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Scrollable turn history for the AI panel. Shows Kraft's empty state with
 * page-aware suggestions when there are no turns yet, otherwise renders each
 * turn oldest-first and auto-scrolls to the newest one. Only the latest
 * turn's avatar follows Kraft's live emotion.
 */
export function AiThread() {
  const { turns } = useAiPanel();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [turns.length]);

  if (turns.length === 0) {
    return <AiThreadEmpty />;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {turns.map((turn, index) => (
        <AiTurn key={turn.id} turn={turn} isLatest={index === turns.length - 1} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
