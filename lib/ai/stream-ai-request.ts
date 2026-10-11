import { consumeSSEResponse } from "@/lib/ai/consume-sse-response";
import type {
  ConsumeSSECallbacks,
  ConsumeSSEResult,
} from "@/lib/ai/consume-sse-response";
import type { AIStreamRequest } from "@/lib/ai/types";

export type { ConsumeSSECallbacks, ConsumeSSEResult };

/**
 * The single shared fetch + SSE-consume scaffold for talking to
 * `/api/ai/stream`. No React, no local state — callers (hooks) own state
 * accumulation and abort lifecycle; this just performs the request and
 * forwards parsed events to the given callbacks.
 *
 * In this frontend-only build the endpoint is served by
 * `app/api/ai/stream/route.ts`, which fakes the model turn and stores the
 * conversation in `mock-db.json`. Same wire format, no model, no external
 * service.
 */
export async function streamAiRequest(
  input: AIStreamRequest,
  callbacks: ConsumeSSECallbacks,
  signal: AbortSignal,
): Promise<ConsumeSSEResult> {
  const response = await fetch("/api/ai/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  return consumeSSEResponse(response, callbacks, signal);
}
