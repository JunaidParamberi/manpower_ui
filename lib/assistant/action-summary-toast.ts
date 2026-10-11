import type { ActionEvent } from "./stream-events";

const MAX_PARTS = 3;

/**
 * Build a one-line toast title from the actions emitted during an AI turn.
 * Empty when there are no actions — caller should skip the toast in that case.
 */
export function summarizeActionsForToast(actions: ActionEvent[]): string {
  if (actions.length === 0) {
    return "";
  }
  const parts = actions.slice(0, MAX_PARTS).map((a) => a.summary);
  if (actions.length > MAX_PARTS) {
    parts.push("…");
  }
  return parts.join(", ");
}
