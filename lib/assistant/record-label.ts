/**
 * Turning a stored row into something a person recognises.
 *
 * The generic write tools address records by UUID, which is correct for the
 * database and useless to the user: a confirmation card reading
 * "Record: clients / ID: ca54d60b-…" gives them no way to tell whether the
 * right record is about to be deleted. These helpers resolve the columns the
 * registry marks as identifying, so the card can say "Test Client Co."
 * instead.
 *
 * Pure functions over a row that the caller has already fetched — nothing
 * here touches the database, so the caller keeps control of RLS scoping.
 */

import type { EditContext } from "./document-edit.ts";
import { getEntityRule } from "./entity-registry.ts";

/** What a caller resolved about a record before staging a confirmation. */
export type RecordContext = {
  /** Human name for the record, e.g. "Test Client Co.". */
  name: string | null;
  /** One extra identifying value, e.g. an email. Null when there isn't one. */
  detail: string | null;
  /**
   * Current values of the columns an update is about to change, keyed by
   * column. Empty for any other tool.
   */
  before: Record<string, unknown>;
  /** edit_document only: the document's label, current values and referenced names. */
  edit?: EditContext;
};

export const EMPTY_RECORD_CONTEXT: RecordContext = {
  name: null,
  detail: null,
  before: {},
};

export function labelFieldsFor(entity: string): readonly string[] {
  return getEntityRule(entity)?.labelFields ?? [];
}

/**
 * Every identifying value present on the row, in registry order. `pickLabel`
 * takes the first and `pickDetail` the second, so they can never disagree
 * about which value was already used as the name.
 */
function identifyingValues(
  entity: string,
  row: Record<string, unknown> | null,
): string[] {
  if (!row) {
    return [];
  }
  const found: string[] = [];
  for (const field of labelFieldsFor(entity)) {
    const value = row[field];
    if (value === null || value === undefined) {
      continue;
    }
    const text = String(value).trim();
    if (text.length > 0) {
      found.push(text);
    }
  }
  return found;
}

/** The record's display name, or null when the row carries nothing usable. */
export function pickLabel(
  entity: string,
  row: Record<string, unknown> | null,
): string | null {
  return identifyingValues(entity, row)[0] ?? null;
}

/** A second identifying value, never a repeat of the one `pickLabel` used. */
export function pickDetail(
  entity: string,
  row: Record<string, unknown> | null,
): string | null {
  return identifyingValues(entity, row)[1] ?? null;
}

/**
 * Columns worth selecting to describe a pending write: the identifying ones,
 * plus the ones an update is about to overwrite so the card can show
 * "before → after".
 *
 * Changed columns are intersected with `readFields`. A write allowlist is not
 * a read allowlist — `documents.internal_notes` is writable but not readable —
 * and this must not become a side channel for reading a column the registry
 * withheld. A column that misses the intersection simply loses its "before"
 * half; nothing else degrades.
 */
export function contextColumns(entity: string, changedFields: readonly string[]): string[] {
  const rule = getEntityRule(entity);
  if (!rule || !rule.read) {
    return [];
  }
  const columns = new Set<string>(rule.labelFields);
  for (const field of changedFields) {
    if (rule.readFields.includes(field)) {
      columns.add(field);
    }
  }
  return [...columns];
}
