import { typeFromSlug } from "@/lib/documents/document-routes";
import type { DocumentType } from "@/types";

export type ListFilters = {
  type: DocumentType | null;
  search: string | null;
  recurringOnly: boolean;
};

/**
 * The threat is not "unexpected characters" — it is that PostgREST parses the
 * `.or(...)` filter string itself. Commas separate its clauses, parentheses
 * delimit its groups, and `"` / `\` are its quoting and escape characters, so
 * a raw term carrying any of them does not merely fail to match: it rewrites
 * the filter it was interpolated into. `%` is stripped for a lesser reason —
 * it is a LIKE wildcard, so a term containing it would silently widen the
 * match.
 *
 * The fix keeps letters and digits in ANY script. This app targets UAE / UK /
 * US / MENA, so an ASCII allowlist was actively wrong: it turned `Müller` into
 * `mller` and an Arabic client name into the empty string, and an empty term
 * counts as "no search" — which returns the FULL list. A wrong answer is worse
 * than an empty one. So the allowlist is `\p{L}` + `\p{N}` plus the handful of
 * punctuation document numbers are built from, and everything PostgREST parses
 * falls outside it by construction.
 *
 * `_` is deliberately kept, and it is a single-character LIKE wildcard, so
 * searching `INV_01` also matches `INV-01` and `INV901`. That is harmless
 * over-matching on a search box, and dropping `_` would break real document
 * numbers, so it stays.
 */
const DISALLOWED_SEARCH_CHARS = /[^\p{L}\p{N} .#_-]/gu;

export function sanitizeSearchTerm(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  const cleaned = raw
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .replace(DISALLOWED_SEARCH_CHARS, "")
    .replace(/\s+/gu, " ")
    .trim();
  return cleaned || null;
}

export function normalizeListFilters(input: {
  /** First path segment under /documents — a type slug, an id, or "new". */
  slug?: string;
  /** `?list=` — carries the active type tab onto a detail route. */
  list?: string;
  q?: string;
  recurring?: string;
}): ListFilters {
  const type =
    (input.slug ? typeFromSlug(input.slug) : null) ??
    (input.list ? typeFromSlug(input.list) : null);

  return {
    type,
    search: sanitizeSearchTerm(input.q),
    recurringOnly: type === "invoice" && input.recurring === "1",
  };
}
