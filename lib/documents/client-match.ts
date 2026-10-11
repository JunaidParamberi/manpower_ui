export type ClientCandidate = { id: string; name: string };

export type ClientMatchResult =
  | { status: "matched"; clientId: string }
  | { status: "ambiguous"; candidateNames: string[] }
  | { status: "none" };

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matchClientByName(
  rawName: string,
  candidates: ClientCandidate[],
): ClientMatchResult {
  const target = normalize(rawName);
  if (!target) {
    return { status: "none" };
  }

  const matches = candidates.filter((c) => normalize(c.name) === target);

  if (matches.length === 0) {
    return { status: "none" };
  }
  if (matches.length === 1) {
    return { status: "matched", clientId: matches[0].id };
  }
  return {
    status: "ambiguous",
    candidateNames: matches.map((c) => c.name),
  };
}
