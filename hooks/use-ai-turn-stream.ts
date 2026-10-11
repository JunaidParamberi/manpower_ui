"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { streamAiRequest } from "@/lib/ai/stream-ai-request";
import type { AiTurn } from "@/lib/ai-panel/types";
import type { ActionEvent } from "@/lib/assistant/stream-events";
import { applyTrailEvent, type TrailStep } from "@/lib/ai-panel/trail-steps";
import { useAgentActivityPublish } from "@/lib/ai-panel/agent-activity-context";

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

type UseAiTurnStreamOptions = {
  /**
   * Active conversation thread id. Sent on every prompt so the assistant
   * loads prior messages. Updated when the server emits a new thread on
   * the first turn of a session.
   */
  threadId: string | null;
  onThreadCreated?: (threadId: string, title: string) => void;
};

type RunInput = {
  prompt: string;
  mode: "ask" | "agent";
};

/**
 * Drives one AI panel turn against the assistant Edge Function. Single phase:
 * the assistant runs its own tool loop server-side. Returns the array of
 * `ActionEvent`s the assistant emitted during the turn so the caller can
 * trigger cache invalidation + a completion toast.
 */
export function useAiTurnStream(
  turnId: string,
  updateTurn: (id: string, patch: Partial<Omit<AiTurn, "id">>) => void,
  options: UseAiTurnStreamOptions,
) {
  const abortRef = useRef<AbortController | null>(null);
  const [actions, setActions] = useState<ActionEvent[]>([]);
  const publishActivity = useAgentActivityPublish();
  const { threadId, onThreadCreated } = options;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const run = useCallback(
    async ({ prompt, mode }: RunInput) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      let accumulated = "";
      const turnActions: ActionEvent[] = [];
      let turnSteps: TrailStep[] = [];

      try {
        await streamAiRequest(
          {
            prompt,
            assistantMode: mode,
            pagePath: window.location.pathname,
            threadId: threadId ?? undefined,
          },
          {
            onRoute: () => {},
            onToken: (text) => {
              accumulated += text;
              updateTurn(turnId, { text: accumulated, activeTool: null });
            },
            onToolStart: (event) => {
              turnSteps = applyTrailEvent(turnSteps, {
                kind: "tool_start",
                tool: event.tool,
                entity: event.entity,
                label: event.label,
              });
              updateTurn(turnId, { activeTool: event.label, steps: turnSteps });
            },
            onToolDone: (event) => {
              turnSteps = applyTrailEvent(turnSteps, { kind: "tool_done", summary: event.summary });
              updateTurn(turnId, { activeTool: null, steps: turnSteps });
            },
            onAction: (event) => {
              turnActions.push(event);
              setActions([...turnActions]);
              updateTurn(turnId, { actions: [...turnActions] });
              if (event.entityId && !event.summary.toLowerCase().startsWith("delete")) {
                publishActivity(event.entity, event.entityId);
              }
            },
            onToolError: (event) => {
              turnSteps = applyTrailEvent(turnSteps, {
                kind: "tool_error",
                message: event.message,
              });
              updateTurn(turnId, { steps: turnSteps });
            },
            onModeHint: (event) => {
              updateTurn(turnId, { modeHint: event, activeTool: null });
            },
            onConfirm: (event) => {
              updateTurn(turnId, {
                status: "done",
                pendingConfirm: event,
                activeTool: null,
              });
              abortRef.current = null;
            },
            onDone: (_finishReason, { draft, emailDraft }) => {
              updateTurn(turnId, {
                status: "done",
                draft,
                emailDraft,
                activeTool: null,
              });
              abortRef.current = null;
            },
            onError: (message) => {
              updateTurn(turnId, {
                status: "error",
                error: message,
                activeTool: null,
              });
              abortRef.current = null;
            },
            onThreadCreated: (id, title) => {
              onThreadCreated?.(id, title);
            },
          },
          controller.signal,
        );
      } catch (err) {
        if (controller.signal.aborted || isAbortError(err)) {
          return;
        }
        updateTurn(turnId, {
          status: "error",
          error: err instanceof Error ? err.message : "Stream failed.",
          activeTool: null,
        });
        abortRef.current = null;
      }
    },
    [turnId, updateTurn, threadId, onThreadCreated],
  );

  return { run, actions };
}
