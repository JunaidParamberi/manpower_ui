import type { RouterResult } from "@/lib/ai/router-result";
import type { DocumentDraftResult } from "@/lib/ai/document-writer-result";
import type { CommunicationDraftResult } from "@/lib/ai/communication-draft-result";
import type { CampaignDraftItem } from "@/lib/ai/content-draft-result";
import type { RelationshipReadResult } from "@/lib/ai/relationship-read-result";
import type {
  ActionEvent,
  ConfirmEvent,
  ModeHintEvent,
  ThreadCreatedEvent,
  ToolDoneEvent,
  ToolErrorEvent,
  ToolStartEvent,
} from "@/lib/assistant/stream-events";

export type AIStreamRequest = {
  prompt?: string;
  agent?: string;
  /** assistant: "ask" exposes read tools only, "agent" adds writes. */
  assistantMode?: "ask" | "agent";
  /** assistant: continues an existing thread, or resumes a paused one. */
  threadId?: string;
  /** assistant: the route the user is on, for "Currently viewing" context. */
  pagePath?: string;
  /** communication-drafter: what kind of email to write. */
  mode?: CommunicationDraftResult["mode"];
  /** communication-drafter: requested tone. */
  tone?: CommunicationDraftResult["tone"];
  /** communication-drafter target — the server reloads the facts from the id. */
  documentId?: string;
  clientId?: string;
  projectId?: string;
  /** communication-drafter reply mode: the message being replied to. */
  incomingMessage?: string;
  input?: Record<string, unknown>;
};

export type AIStreamTokenEvent = {
  type: "token";
  text: string;
};

export type AIStreamRouteEvent = {
  type: "route";
  agent: RouterResult["agent"];
  confidence: number;
  payload: RouterResult["payload"];
};

export type AIStreamDoneEvent = {
  type: "done";
  finishReason: string;
  draft?: DocumentDraftResult;
  emailDraft?: CommunicationDraftResult;
  /** content-marketer draft-single: the drafted caption text. */
  caption?: string;
  /** content-marketer draft-single: the drafted hashtag list. */
  hashtags?: string[];
  /** content-marketer generate-campaign: the drafted campaign posts. */
  campaignDrafts?: CampaignDraftItem[];
  /** relationship-manager: the structured health narrative. */
  relationshipRead?: RelationshipReadResult;
};

export type AIStreamErrorEvent = {
  type: "error";
  message: string;
};

export type AIStreamEvent =
  | AIStreamTokenEvent
  | AIStreamRouteEvent
  | AIStreamDoneEvent
  | AIStreamErrorEvent
  | ToolStartEvent
  | ToolDoneEvent
  | ActionEvent
  | ToolErrorEvent
  | ConfirmEvent
  | ModeHintEvent
  | ThreadCreatedEvent;

export type AIStreamStatus = "idle" | "streaming" | "done" | "error";

/** The full payload carried by the terminal `done` SSE event, as last received. */
export type AIStreamDonePayload = {
  draft: DocumentDraftResult | null;
  emailDraft: CommunicationDraftResult | null;
  caption: string | null;
  hashtags: string[] | null;
  campaignDrafts: CampaignDraftItem[] | null;
  relationshipRead: RelationshipReadResult | null;
};

export type AIStreamState = {
  status: AIStreamStatus;
  text: string;
  route: RouterResult | null;
  error: string | null;
  /** Last `done` event payload, or null before a stream completes. */
  donePayload: AIStreamDonePayload | null;
};

export const INITIAL_AI_STREAM_STATE: AIStreamState = {
  status: "idle",
  text: "",
  route: null,
  error: null,
  donePayload: null,
};
