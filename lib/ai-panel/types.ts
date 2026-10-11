import type { RouterResult } from "@/lib/ai/router-result";
import type { DocumentDraftResult } from "@/lib/ai/document-writer-result";
import type { CommunicationDraftResult } from "@/lib/ai/communication-draft-result";
import type { ActionEvent, ConfirmEvent, ModeHintEvent } from "@/lib/assistant/stream-events";
import type { TrailStep } from "@/lib/ai-panel/trail-steps";

export type AiTurnStatus = "streaming" | "done" | "error";

export type AiTurn = {
  id: string;
  prompt: string;
  status: AiTurnStatus;
  /**
   * The mode this turn was SUBMITTED in, which is not necessarily the mode
   * the panel is in now. Retrying reuses it — otherwise toggling to Ask after
   * an Agent turn silently downgrades the retry into a read-only one.
   */
  mode: AiPanelMode;
  text: string;
  route: RouterResult | null;
  draft: DocumentDraftResult | null;
  emailDraft: CommunicationDraftResult | null;
  error: string | null;
  /** Completed writes reported by the assistant during this turn. */
  actions: ActionEvent[];
  /** A risky write waiting on the user's confirmation, if any. */
  pendingConfirm: ConfirmEvent | null;
  /** Ask mode: the write this turn asked for but could not run. */
  modeHint: ModeHintEvent | null;
  /** Label of the tool currently running, for the in-flight chip. */
  activeTool: string | null;
  /** Ordered trail of every tool call made during this turn. Persisted, so it survives a refresh. */
  steps: TrailStep[];
};

export type AiPanelMode = "ask" | "agent";

export type AiPanelState = {
  isOpen: boolean;
  mode: AiPanelMode;
  threadId: string | null;
  turns: AiTurn[];
};
