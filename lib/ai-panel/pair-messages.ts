import type { ThreadMessage } from "@/lib/assistant/thread-queries";
import type { AiPanelMode, AiTurn } from "./types";

/**
 * Pairs consecutive user/assistant message rows (oldest -> newest, as
 * returned by `listMessages`) into a single `AiTurn` each. `AiTurn` always
 * renders both a prompt bubble and a response body, so a naive 1-row-1-turn
 * mapping produces a doubled, misaligned UI on rehydrate (an empty prompt
 * bubble above every assistant reply, and an empty response box below every
 * user message).
 *
 * Normal conversation flow is strictly alternating user -> assistant, since
 * the assistant Edge Function always writes exactly one user row then one
 * assistant row per turn. A trailing user row with no following assistant
 * row (e.g. a stream errored mid-turn) still renders as a turn, but with
 * `status: "error"` so the panel shows retry UI instead of a blank response.
 *
 * One exception to alternation: a risky write pauses its turn (user +
 * assistant rows written, ending with a confirm request) and
 * `assistant-confirm` appends a THIRD, assistant-only row once the user
 * approves/denies/it fails — the resolved action's own text and metadata.
 * That row is folded onto the immediately preceding turn (text joined with
 * a blank line, actions/steps concatenated) rather than rendered as its own
 * bubble, so a refresh shows the same single card the user saw live. An
 * assistant row with NO preceding turn at all (the very first row in the
 * list) has no turn to fold onto and is defensively skipped.
 */
export function pairMessagesIntoTurns(
  messages: ThreadMessage[],
  threadMode: AiPanelMode,
): AiTurn[] {
  const turns: AiTurn[] = [];
  let i = 0;
  while (i < messages.length) {
    const row = messages[i];
    if (row.role !== "user") {
      const prior = turns[turns.length - 1];
      if (prior) {
        prior.text = prior.text ? `${prior.text}\n\n${row.content}` : row.content;
        prior.actions = [...prior.actions, ...row.actions];
        prior.steps = [...prior.steps, ...row.steps];
        prior.draft = row.draft ?? prior.draft;
        prior.emailDraft = row.emailDraft ?? prior.emailDraft;
      }
      i += 1;
      continue;
    }
    const next = messages[i + 1];
    if (next && next.role === "assistant") {
      turns.push({
        id: `seed-${i}`,
        prompt: row.content,
        status: "done",
        mode: threadMode,
        text: next.content,
        route: null,
        draft: next.draft,
        emailDraft: next.emailDraft,
        error: null,
        actions: next.actions,
        pendingConfirm: null,
        modeHint: null,
        activeTool: null,
        steps: next.steps,
      });
      i += 2;
    } else {
      turns.push({
        id: `seed-${i}`,
        prompt: row.content,
        status: "error",
        mode: threadMode,
        text: "",
        route: null,
        draft: null,
        emailDraft: null,
        error: null,
        actions: [],
        pendingConfirm: null,
        modeHint: null,
        activeTool: null,
        steps: [],
      });
      i += 1;
    }
  }
  return turns;
}
