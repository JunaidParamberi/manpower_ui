/**
 * Automatic document titles: "Quote for Nova Retail FZ-LLC — Website redesign".
 * Used while `documents.title_is_auto` is true; typing a title switches the
 * document to a custom title.
 */

const TYPE_NAMES: Record<string, string> = {
  quote: "Quote",
  invoice: "Invoice",
  proposal: "Proposal",
  receipt: "Receipt",
  local_purchase_order: "Purchase order",
  statement: "Statement",
  credit_note: "Credit note",
  delivery_note: "Delivery note",
  other: "Document",
};

/** Keeps auto titles short enough to scan in lists and email subjects. */
const MAX_TITLE = 120;
const MAX_PART = 56;

export type AutoTitleInput = {
  type: string;
  clientName: string | null | undefined;
  projectTitle: string | null | undefined;
  firstItem: string | null | undefined;
};

function clean(value: string | null | undefined): string | null {
  const v = value?.replace(/\s+/g, " ").trim();
  return v ? v : null;
}

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

export function buildAutoTitle({ type, clientName, projectTitle, firstItem }: AutoTitleInput): string {
  const typeName = TYPE_NAMES[type] ?? "Document";
  const client = clean(clientName);
  const subject = clean(projectTitle) ?? clean(firstItem);

  let title: string;
  if (client && subject) title = `${typeName} for ${clip(client, MAX_PART)} — ${clip(subject, MAX_PART)}`;
  else if (client) title = `${typeName} for ${clip(client, MAX_PART)}`;
  else if (subject) title = `${typeName} — ${clip(subject, MAX_PART)}`;
  else title = `New ${typeName.toLowerCase()}`;

  return clip(title, MAX_TITLE);
}

/** The "Untitled quote" style defaults documents were created with before auto titles. */
export function isLegacyPlaceholderTitle(title: string): boolean {
  return /^untitled\b/i.test(title.trim());
}

/**
 * What a submitted title means: blank → go (back) to automatic; unchanged →
 * keep the current mode; anything else → the user's own title.
 */
export function resolveTitleSubmission({
  submitted,
  current,
  currentIsAuto,
}: {
  submitted: string | null | undefined;
  current: string;
  currentIsAuto: boolean;
}): { titleIsAuto: true } | { titleIsAuto: false; title: string } {
  const next = submitted?.trim() ?? "";
  if (!next) return { titleIsAuto: true };
  if (next === current.trim()) {
    return currentIsAuto ? { titleIsAuto: true } : { titleIsAuto: false, title: next };
  }
  return { titleIsAuto: false, title: next };
}
