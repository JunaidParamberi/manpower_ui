import type { ActionEvent } from "./stream-events.ts";
import type { TrailStep } from "../ai-panel/trail-steps.ts";
import {
  communicationDraftResultSchema,
  type CommunicationDraftResult,
} from "../ai/communication-draft-result.ts";
import {
  documentDraftResultSchema,
  type DocumentDraftResult,
} from "../ai/document-writer-result.ts";

/**
 * What gets written into `ai_messages.tool_calls` for an assistant row: the
 * live activity data a turn produced (step trail + completed actions + any
 * document/email draft card), so a
 * page refresh can rehydrate the same cards the user saw during the stream
 * instead of falling back to bare text. The column name is a holdover from
 * an earlier design; nothing replays this to Claude, so it is free to hold
 * UI metadata instead.
 */
export type PersistedTurnMeta = {
  actions: ActionEvent[];
  steps: TrailStep[];
  draft?: DocumentDraftResult | null;
  emailDraft?: CommunicationDraftResult | null;
};

export type ParsedTurnMeta = {
  actions: ActionEvent[];
  steps: TrailStep[];
  draft: DocumentDraftResult | null;
  emailDraft: CommunicationDraftResult | null;
};

export function parseTurnMeta(value: unknown): ParsedTurnMeta {
  if (!value || typeof value !== "object") {
    return { actions: [], steps: [], draft: null, emailDraft: null };
  }
  const record = value as Record<string, unknown>;
  // Drafts are re-validated on the way out: a malformed stored draft drops
  // its card instead of crashing the panel on reload.
  const draft = documentDraftResultSchema.safeParse(record.draft);
  const emailDraft = communicationDraftResultSchema.safeParse(record.emailDraft);
  return {
    actions: Array.isArray(record.actions) ? (record.actions as ActionEvent[]) : [],
    steps: Array.isArray(record.steps) ? (record.steps as TrailStep[]) : [],
    draft: draft.success ? draft.data : null,
    emailDraft: emailDraft.success ? emailDraft.data : null,
  };
}
