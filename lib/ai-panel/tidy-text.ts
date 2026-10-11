/**
 * Last-line cleanup for Kraft's replies, applied at render time. The system
 * prompt already asks for no dashes and no run-together sentences; this
 * catches the ones that slip through. Code (fenced and inline) is left
 * exactly as written.
 */
export function tidyAssistantText(text: string): string {
  return text
    .split(/(```[\s\S]*?(?:```|$)|`[^`\n]*`)/)
    .map((part, index) => (index % 2 === 1 ? part : tidyProse(part)))
    .join("");
}

function tidyProse(text: string): string {
  return (
    text
      // "word — word" / "word – word" read as a pause: use a comma.
      .replace(/[ \t]+[—–][ \t]+/g, ", ")
      // "word—word" (no spaces) is the same pause.
      .replace(/(\S)—(\S)/g, "$1, $2")
      // A dash ending a line or clause before punctuation adds nothing.
      .replace(/[ \t]*[—–][ \t]*(?=[.,;:!?\n]|$)/g, "")
      // Two streamed sentences glued together: "for you.Confirmed".
      .replace(/([a-z)])\.([A-Z][a-z])/g, "$1. $2")
      // A comma we introduced right after another comma.
      .replace(/,\s*,/g, ",")
  );
}
