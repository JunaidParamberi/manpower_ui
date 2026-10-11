"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { streamAiRequest } from "@/lib/ai/stream-ai-request";
import {
  INITIAL_AI_STREAM_STATE,
  type AIStreamRequest,
  type AIStreamState,
} from "@/lib/ai/types";

export function useAIStream() {
  const [state, setState] = useState<AIStreamState>(INITIAL_AI_STREAM_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    abort();
    setState(INITIAL_AI_STREAM_STATE);
  }, [abort]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const stream = useCallback(
    async (input: AIStreamRequest) => {
      abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        status: "streaming",
        text: "",
        route: null,
        error: null,
        donePayload: null,
      });

      try {
        let accumulated = "";

        const result = await streamAiRequest(
          input,
          {
            onToken: (text) => {
              accumulated += text;
              setState((prev) => ({
                ...prev,
                status: "streaming",
                text: accumulated,
                error: null,
              }));
            },
            onRoute: (route) => {
              setState((prev) => ({
                ...prev,
                route,
              }));
            },
            onDone: (_finishReason, payload) => {
              setState((prev) => ({
                ...prev,
                status: "done",
                text: accumulated,
                error: null,
                donePayload: payload,
              }));
              abortRef.current = null;
            },
            onError: (message) => {
              setState((prev) => ({
                ...prev,
                status: "error",
                error: message,
              }));
              abortRef.current = null;
            },
          },
          controller.signal,
        );

        if (!result.ok && !controller.signal.aborted) {
          setState((prev) =>
            prev.status === "error"
              ? prev
              : {
                  ...prev,
                  status: "error",
                  error: result.error,
                },
          );
        } else if (
          result.ok &&
          result.events.length > 0 &&
          result.events[result.events.length - 1]?.type === "token"
        ) {
          setState((prev) => ({
            ...prev,
            status: "done",
            text: accumulated,
            error: null,
          }));
          abortRef.current = null;
        }
      } catch (err) {
        if (controller.signal.aborted) {
          setState((prev) => ({
            ...prev,
            status: "idle",
            error: null,
          }));
          return;
        }
        const message = err instanceof Error ? err.message : "Stream failed.";
        setState({
          status: "error",
          text: "",
          route: null,
          error: message,
          donePayload: null,
        });
        abortRef.current = null;
      }
    },
    [abort],
  );

  return {
    ...state,
    stream,
    abort,
    reset,
    isStreaming: state.status === "streaming",
  };
}
