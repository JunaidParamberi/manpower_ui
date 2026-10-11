import type { AIStreamDoneEvent, AIStreamEvent } from "@/lib/ai/types";
import { isAgentId } from "@/lib/ai/agents";

export type SSEParserState = {
  buffer: string;
};

export function createSSEParserState(): SSEParserState {
  return { buffer: "" };
}

function parseEventBlock(block: string): AIStreamEvent | null {
  const lines = block.split("\n");
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const raw = dataLines.join("\n");

  try {
    const payload = JSON.parse(raw) as Record<string, unknown>;

    if (eventName === "token" && typeof payload.text === "string") {
      return { type: "token", text: payload.text };
    }

    if (eventName === "route") {
      const agent = payload.agent;
      const confidence = payload.confidence;
      const routePayload = payload.payload;
      if (
        typeof agent === "string" &&
        typeof confidence === "number" &&
        routePayload &&
        typeof routePayload === "object" &&
        !Array.isArray(routePayload)
      ) {
        const record = routePayload as Record<string, unknown>;
        const intent = record.intent;
        const summary = record.summary;
        if (typeof intent === "string" && typeof summary === "string") {
          let entities: Record<string, string> | undefined;
          const entitiesRaw = record.entities;
          if (
            entitiesRaw &&
            typeof entitiesRaw === "object" &&
            !Array.isArray(entitiesRaw)
          ) {
            entities = {};
            for (const [key, value] of Object.entries(entitiesRaw)) {
              if (typeof value === "string") {
                entities[key] = value;
              }
            }
          }
          if (!isAgentId(agent)) {
            return null;
          }
          return {
            type: "route",
            agent,
            confidence,
            payload: {
              intent,
              summary,
              entities,
            },
          };
        }
      }
    }

    if (eventName === "done") {
      const finishReason =
        typeof payload.finishReason === "string"
          ? payload.finishReason
          : "stop";
      const draft =
        payload.draft && typeof payload.draft === "object"
          ? (payload.draft as AIStreamDoneEvent["draft"])
          : undefined;
      const emailDraft =
        payload.emailDraft && typeof payload.emailDraft === "object"
          ? (payload.emailDraft as AIStreamDoneEvent["emailDraft"])
          : undefined;
      const caption =
        typeof payload.caption === "string" ? payload.caption : undefined;
      const hashtags = Array.isArray(payload.hashtags)
        ? payload.hashtags.filter((h): h is string => typeof h === "string")
        : undefined;
      const campaignDrafts = Array.isArray(payload.campaignDrafts)
        ? (payload.campaignDrafts as AIStreamDoneEvent["campaignDrafts"])
        : undefined;
      const relationshipRead =
        payload.relationshipRead &&
        typeof payload.relationshipRead === "object" &&
        !Array.isArray(payload.relationshipRead)
          ? (payload.relationshipRead as AIStreamDoneEvent["relationshipRead"])
          : undefined;
      const result: AIStreamDoneEvent = { type: "done", finishReason };
      if (draft !== undefined) result.draft = draft;
      if (emailDraft !== undefined) result.emailDraft = emailDraft;
      if (caption !== undefined) result.caption = caption;
      if (hashtags !== undefined) result.hashtags = hashtags;
      if (campaignDrafts !== undefined) result.campaignDrafts = campaignDrafts;
      if (relationshipRead !== undefined) result.relationshipRead = relationshipRead;
      return result;
    }

    if (eventName === "error") {
      const message =
        typeof payload.message === "string"
          ? payload.message
          : "Stream failed.";
      return { type: "error", message };
    }

    if (eventName === "thread_created") {
      const threadId = payload.threadId;
      const title = payload.title;
      if (typeof threadId === "string" && typeof title === "string") {
        return { type: "thread_created", threadId, title };
      }
      return null;
    }

    if (eventName === "tool_start") {
      const tool = payload.tool;
      const label = payload.label;
      const entity = payload.entity;
      if (typeof tool === "string" && typeof label === "string") {
        return {
          type: "tool_start",
          tool,
          entity: typeof entity === "string" ? entity : null,
          label,
        };
      }
      return null;
    }

    if (eventName === "tool_done") {
      const tool = payload.tool;
      const entity = payload.entity;
      const summary = payload.summary;
      if (typeof tool === "string" && typeof summary === "string") {
        return {
          type: "tool_done",
          tool,
          entity: typeof entity === "string" ? entity : null,
          summary,
        };
      }
      return null;
    }

    if (eventName === "action") {
      const summary = payload.summary;
      const entity = payload.entity;
      const entityId = payload.entityId;
      const undoToken = payload.undoToken;
      if (typeof summary === "string" && typeof entity === "string") {
        return {
          type: "action",
          summary,
          entity,
          entityId: typeof entityId === "string" ? entityId : null,
          undoToken: typeof undoToken === "string" ? undoToken : null,
        };
      }
      return null;
    }

    if (eventName === "tool_error") {
      const tool = payload.tool;
      const entity = payload.entity;
      const message = payload.message;
      if (typeof tool === "string" && typeof message === "string") {
        return {
          type: "tool_error",
          tool,
          entity: typeof entity === "string" ? entity : null,
          message,
        };
      }
      return null;
    }

    if (eventName === "mode_hint") {
      const action = payload.action;
      if (typeof action === "string" && action.length > 0) {
        return { type: "mode_hint", requiredMode: "agent", action };
      }
      return null;
    }

    if (eventName === "confirm") {
      const summary = payload.summary;
      const threadId = payload.threadId;
      const toolUseId = payload.toolUseId;
      const detail = payload.detail;
      if (
        typeof summary === "string" &&
        typeof threadId === "string" &&
        typeof toolUseId === "string" &&
        Array.isArray(detail) &&
        detail.every((d): d is string => typeof d === "string")
      ) {
        return {
          type: "confirm",
          summary,
          threadId,
          toolUseId,
          detail,
        };
      }
      return null;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Incrementally parse SSE blocks from streamed bytes.
 * SSE events are separated by a blank line (\n\n).
 */
export function parseSSEChunk(
  state: SSEParserState,
  chunk: string,
): AIStreamEvent[] {
  state.buffer += chunk;
  const events: AIStreamEvent[] = [];

  let separatorIndex = state.buffer.indexOf("\n\n");
  while (separatorIndex !== -1) {
    const block = state.buffer.slice(0, separatorIndex);
    state.buffer = state.buffer.slice(separatorIndex + 2);

    const trimmed = block.trim();
    if (trimmed.length > 0) {
      const event = parseEventBlock(trimmed);
      if (event) {
        events.push(event);
      }
    }

    separatorIndex = state.buffer.indexOf("\n\n");
  }

  return events;
}

export function formatSSEEvent(
  event: "token" | "route" | "done" | "error" | "mode_hint" | "tool_error" | "tool_done",
  data: Record<string, unknown>,
): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
