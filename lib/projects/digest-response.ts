// lib/projects/digest-response.ts
//
// Validates the Project Intelligence model response. Every action must
// point at a project id that appeared in the server-computed facts —
// anything else is dropped rather than rendered. Zero imports so this
// resolves under both Node (Vitest) and Deno (the Edge Function).

export type DigestAction = {
  projectId: string;
  title: string;
  detail: string;
};

export type ParsedDigest = {
  narrative: string | null;
  actions: DigestAction[];
};

const MAX_ACTIONS = 3;

const EMPTY: ParsedDigest = { narrative: null, actions: [] };

/** Strips a ```json … ``` fence if the model wrapped its output in one. */
function stripFence(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseDigestResponse(
  raw: string,
  knownProjectIds: string[],
): ParsedDigest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripFence(raw));
  } catch {
    return { ...EMPTY };
  }

  if (!parsed || typeof parsed !== "object") return { ...EMPTY };

  const record = parsed as Record<string, unknown>;
  const narrative = nonEmptyString(record.narrative);

  const rawActions = Array.isArray(record.actions) ? record.actions : [];
  const actions: DigestAction[] = [];

  for (const candidate of rawActions) {
    if (actions.length >= MAX_ACTIONS) break;
    if (!candidate || typeof candidate !== "object") continue;

    const item = candidate as Record<string, unknown>;
    const projectId = nonEmptyString(item.projectId);
    const title = nonEmptyString(item.title);
    const detail = nonEmptyString(item.detail);

    if (!projectId || !title || !detail) continue;
    if (!knownProjectIds.includes(projectId)) continue;

    actions.push({ projectId, title, detail });
  }

  return { narrative, actions };
}
