/**
 * Kraft's clickable answers. When the assistant asks the user to pick, it
 * ends its reply with lines like `[[choice: Nova Retail FZ-LLC]]` (see the
 * system prompt). The UI strips those markers from the text and shows them
 * as buttons; clicking one sends it back as the user's reply.
 */

const CHOICE = /\[\[\s*choice\s*:\s*([^\]\n]+?)\s*\]\]/gi;
/** A marker still arriving at the end of a stream, e.g. "[[cho" or "[[choice: Nova". */
const PARTIAL_TAIL = /\[(?:\[[^\]\n]*)?$/;

export const MAX_CHOICES = 5;

export function extractChoices(text: string): { body: string; choices: string[] } {
  const choices: string[] = [];
  const body = text
    .replace(CHOICE, (_match, label: string) => {
      const value = label.trim();
      if (value && !choices.includes(value) && choices.length < MAX_CHOICES) {
        choices.push(value);
      }
      return "";
    })
    .replace(PARTIAL_TAIL, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
  return { body, choices };
}
