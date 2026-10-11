import type { AIStreamEvent } from "@/lib/ai/types";
import {
  createSSEParserState,
  parseSSEChunk,
} from "@/lib/ai/parse-sse-chunk";

import type { RouterResult } from "@/lib/ai/router-result";
import type { DocumentDraftResult } from "@/lib/ai/document-writer-result";
import type { CommunicationDraftResult } from "@/lib/ai/communication-draft-result";
import type { CampaignDraftItem } from "@/lib/ai/content-draft-result";
import type { RelationshipReadResult } from "@/lib/ai/relationship-read-result";
import type {
  ActionEvent,
  ConfirmEvent,
  ModeHintEvent,
  ToolDoneEvent,
  ToolErrorEvent,
  ToolStartEvent,
} from "@/lib/assistant/stream-events";

export type ConsumeSSECallbacks = {
  onToken: (text: string) => void;
  onRoute: (route: RouterResult) => void;
  onDone: (
    finishReason: string,
    payload: {
      draft: DocumentDraftResult | null;
      emailDraft: CommunicationDraftResult | null;
      caption: string | null;
      hashtags: string[] | null;
      campaignDrafts: CampaignDraftItem[] | null;
      relationshipRead: RelationshipReadResult | null;
    },
  ) => void;
  onError: (message: string) => void;
  onToolStart?: (event: ToolStartEvent) => void;
  onToolDone?: (event: ToolDoneEvent) => void;
  onAction?: (event: ActionEvent) => void;
  onToolError?: (event: ToolErrorEvent) => void;
  onConfirm?: (event: ConfirmEvent) => void;
  /** Ask mode only: a write was requested that Agent mode would have to run. */
  onModeHint?: (event: ModeHintEvent) => void;
  /** Fired once, on the first turn of a new thread. */
  onThreadCreated?: (threadId: string, title: string) => void;
};

export type ConsumeSSEResult =
  | { ok: true; events: AIStreamEvent[] }
  | { ok: false; error: string };

function applyEvent(
  event: AIStreamEvent,
  callbacks: ConsumeSSECallbacks,
  collected: AIStreamEvent[],
): "continue" | "stop" {
  collected.push(event);

  switch (event.type) {
    case "token":
      callbacks.onToken(event.text);
      return "continue";
    case "route":
      callbacks.onRoute({
        agent: event.agent,
        confidence: event.confidence,
        payload: event.payload,
      });
      return "continue";
    case "done":
      callbacks.onDone(event.finishReason, {
        draft: event.draft ?? null,
        emailDraft: event.emailDraft ?? null,
        caption: event.caption ?? null,
        hashtags: event.hashtags ?? null,
        campaignDrafts: event.campaignDrafts ?? null,
        relationshipRead: event.relationshipRead ?? null,
      });
      return "stop";
    case "error":
      callbacks.onError(event.message);
      return "stop";
    case "tool_start":
      callbacks.onToolStart?.(event);
      return "continue";
    case "tool_done":
      callbacks.onToolDone?.(event);
      return "continue";
    case "action":
      callbacks.onAction?.(event);
      return "continue";
    case "tool_error":
      callbacks.onToolError?.(event);
      return "continue";
    case "confirm":
      callbacks.onConfirm?.(event);
      // The server has paused holding state; this stream is finished.
      return "stop";
    case "mode_hint":
      callbacks.onModeHint?.(event);
      return "continue";
    case "thread_created":
      callbacks.onThreadCreated?.(event.threadId, event.title);
      return "continue";
  }
}

/**
 * Read a fetch Response body as SSE and invoke callbacks per event.
 */
export async function consumeSSEResponse(
  response: Response,
  callbacks: ConsumeSSECallbacks,
  signal?: AbortSignal,
): Promise<ConsumeSSEResult> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const json = (await response.json()) as { error?: string };
      if (json.error) {
        message = json.error;
      }
    } catch {
      try {
        const text = await response.text();
        if (text.trim()) {
          message = text.trim();
        }
      } catch {
        // keep default message
      }
    }
    callbacks.onError(message);
    return { ok: false, error: message };
  }

  const body = response.body;
  if (!body) {
    const message = "Empty stream response.";
    callbacks.onError(message);
    return { ok: false, error: message };
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  const parser = createSSEParserState();
  const collected: AIStreamEvent[] = [];

  try {
    while (true) {
      if (signal?.aborted) {
        // Intentional abort (unmount / retry) — not an error. Callers detect
        // the abort via their own signal check; don't surface an error turn.
        return { ok: false, error: "Stream aborted." };
      }

      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const events = parseSSEChunk(parser, chunk);

      for (const event of events) {
        const action = applyEvent(event, callbacks, collected);
        if (action === "stop") {
          return { ok: true, events: collected };
        }
      }
    }

    return { ok: true, events: collected };
  } catch (err) {
    if (signal?.aborted) {
      // Intentional abort — swallow (see note above).
      return { ok: false, error: "Stream aborted." };
    }
    const message = err instanceof Error ? err.message : "Stream failed.";
    callbacks.onError(message);
    return { ok: false, error: message };
  } finally {
    reader.releaseLock();
  }
}
