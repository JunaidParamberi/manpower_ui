"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAiPanel } from "@/lib/ai-panel/context";
import { listThreads, type ThreadListItem } from "@/lib/assistant/thread-queries";
import { cn } from "@/lib/utils";

type AiThreadHistoryMenuProps = {
  triggerClassName?: string;
  iconSize?: number;
};

/**
 * Header control for the Kraft drawer (desktop and mobile): lists past
 * sessions (active and archived `ai_threads` rows) so a "New session" click
 * doesn't strand the previous conversation with no way back to it.
 */
export function AiThreadHistoryMenu({ triggerClassName, iconSize = 14 }: AiThreadHistoryMenuProps) {
  const { threadId, openThread } = useAiPanel();
  const [threads, setThreads] = useState<ThreadListItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const loadThreads = async () => {
    setLoading(true);
    try {
      setThreads(await listThreads());
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) void loadThreads();
      }}
    >
      <DropdownMenuTrigger
        aria-label="Past sessions"
        title="Past sessions"
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md text-[var(--fg-2)] transition-colors hover:bg-[var(--bg-surface)] hover:text-foreground",
          triggerClassName,
        )}
      >
        <History size={iconSize} strokeWidth={1.6} aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {loading && threads === null && (
          <div className="px-2 py-3 text-center text-xs text-[var(--fg-3)]">Loading…</div>
        )}
        {threads !== null && threads.length === 0 && (
          <div className="px-2 py-3 text-center text-xs text-[var(--fg-3)]">No past sessions yet</div>
        )}
        {threads?.map((thread) => (
          <DropdownMenuItem
            key={thread.threadId}
            onClick={() => void openThread(thread)}
            className="flex flex-col items-start gap-0.5"
          >
            <span
              className={cn(
                "line-clamp-1 w-full text-sm",
                thread.threadId === threadId ? "font-medium text-foreground" : "text-[var(--fg-2)]",
              )}
            >
              {thread.title}
            </span>
            <span className="text-xs text-[var(--fg-3)]">
              {formatDistanceToNow(thread.updatedAt, { addSuffix: true })}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
