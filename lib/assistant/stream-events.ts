/**
 * SSE events the assistant adds on top of the existing token/done/error set.
 * Shared verbatim between the Edge Function (serialize) and the browser
 * (parse), so the wire format cannot drift between the two.
 */

export type ThreadCreatedEvent = {
  type: "thread_created";
  threadId: string;
  title: string;
};

export type ToolStartEvent = {
  type: "tool_start";
  tool: string;
  entity: string | null;
  label: string;
};

export type ActionEvent = {
  type: "action";
  summary: string;
  entity: string;
  entityId: string | null;
  undoToken: string | null;
};

/**
 * Fired after EVERY successful tool call, read or write — the only signal
 * that resolves a `tool_start` chip on the step trail. `action` cannot serve
 * that role by itself: it is deliberately never sent for `query_data` (a
 * lookup is not something the panel offers an action card for), which would
 * otherwise leave every read's chip stuck spinning forever.
 */
export type ToolDoneEvent = {
  type: "tool_done";
  tool: string;
  entity: string | null;
  summary: string;
};

export type ConfirmEvent = {
  type: "confirm";
  summary: string;
  threadId: string;
  toolUseId: string;
  detail: string[];
};

export type ToolErrorEvent = {
  type: "tool_error";
  tool: string;
  entity: string | null;
  message: string;
};

/**
 * Ask mode only: the model was asked to do something it has no write tool
 * for in this mode. Carries the action it would have taken so the panel can
 * offer a one-click switch to Agent mode instead of a dead-end refusal.
 */
export type ModeHintEvent = {
  type: "mode_hint";
  requiredMode: "agent";
  action: string;
};

export type AssistantStreamEvent =
  | ThreadCreatedEvent
  | ToolStartEvent
  | ToolDoneEvent
  | ActionEvent
  | ToolErrorEvent
  | ConfirmEvent
  | ModeHintEvent;

const ASSISTANT_EVENT_NAMES = [
  "thread_created",
  "tool_start",
  "tool_done",
  "action",
  "tool_error",
  "confirm",
  "mode_hint",
] as const;

export function isAssistantEventName(name: string): boolean {
  return (ASSISTANT_EVENT_NAMES as readonly string[]).includes(name);
}

/**
 * JSON.stringify escapes newlines, so a summary containing one cannot break
 * the single-line `data:` framing.
 */
export function serializeAssistantEvent(event: AssistantStreamEvent): string {
  const { type, ...data } = event;
  return `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
}

const READ_LABELS: Record<string, string> = {
  query_data: "Looking up",
};

const ACTION_LABELS: Record<string, string> = {
  create_record: "Creating",
  update_record: "Updating",
  delete_record: "Deleting",
  draft_document: "Drafting the document…",
  draft_email: "Drafting the email…",
  send_email: "Preparing to send…",
  record_payment: "Recording the payment…",
  edit_document: "Updating the document…",
};

export function toolStartLabel(tool: string, entity: string | null): string {
  if (READ_LABELS[tool]) {
    return entity ? `${READ_LABELS[tool]} ${entity}…` : `${READ_LABELS[tool]}…`;
  }
  const label = ACTION_LABELS[tool];
  if (!label) {
    return "Working…";
  }
  if (label.endsWith("…")) {
    return label;
  }
  return entity ? `${label} ${entity}…` : `${label}…`;
}
