/**
 * Low-level mock database: load/save `mock-db.json` and the row primitives
 * (insert with defaults, update with `updated_at` touch, unique checks).
 *
 * Server-only — this module imports `node:fs`. Nothing under `lib/mock` may be
 * pulled into a client component.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";

import {
  coerceToColumn,
  columnsOf,
  evaluateDefault,
  getTable,
  hasColumn,
  pkColumns,
  type MockTable,
} from "@/lib/mock/schema";
import type { MockRow, MockUser } from "@/lib/mock/types";

export type MockAuthUserRecord = {
  id: string;
  email: string;
  created_at: string;
};

export type MockDatabase = {
  version: number;
  counter: number;
  users: MockAuthUserRecord[];
  tables: Record<string, MockRow[]>;
};

export type RowError = { message: string; code?: string };

const DB_FILE = "mock-db.json";

export function dbFilePath(): string {
  return path.join(process.cwd(), DB_FILE);
}

export function emptyDatabase(): MockDatabase {
  return { version: 1, counter: 1000, users: [], tables: {} };
}

export function readDatabase(): MockDatabase | null {
  try {
    const raw = fs.readFileSync(dbFilePath(), "utf8");
    const parsed = JSON.parse(raw) as MockDatabase;
    if (!parsed || typeof parsed !== "object" || !parsed.tables) return null;
    parsed.users ??= [];
    parsed.counter ??= 1000;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDatabase(db: MockDatabase): void {
  try {
    fs.writeFileSync(dbFilePath(), JSON.stringify(db));
  } catch (error) {
    console.error("[mock-db] failed to persist:", error);
  }
}

export function rowsOf(db: MockDatabase, table: string): MockRow[] {
  db.tables[table] ??= [];
  return db.tables[table];
}

export function nextCounter(db: MockDatabase): number {
  db.counter += 1;
  return db.counter;
}

/** Apply column defaults + type coercion, exactly like an INSERT would. */
export function buildRow(
  db: MockDatabase,
  table: string,
  payload: MockRow,
  options: { skipConflictCheck?: boolean } = {},
): { row: MockRow } | { error: RowError } {
  const meta = getTable(table);
  if (!meta) return { error: { message: `relation "${table}" does not exist`, code: "42P01" } };

  const row: MockRow = {};
  const now = new Date().toISOString();

  for (const column of meta.columns) {
    const provided = payload[column.name];
    if (provided !== undefined) {
      const coerced = coerceToColumn(column, provided);
      if (coerced !== undefined) row[column.name] = coerced;
      continue;
    }

    if (column.name === "created_at" || column.name === "updated_at") {
      row[column.name] = now;
      continue;
    }
    if (column.identity && column.kind === "int") {
      row[column.name] = nextCounter(db);
      continue;
    }

    const fallback = evaluateDefault(column, db.counter);
    if (fallback !== undefined) {
      row[column.name] = fallback;
      continue;
    }

    // Unknown/no default: keep nullable columns null, leave required text null
    // too — the mock never validates NOT NULL, it only mirrors what it can.
    row[column.name] = null;
  }

  // Carry through any keys the schema doesn't know about (should not happen,
  // but dropping caller data silently would be worse than keeping it).
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && !(key in row)) row[key] = value;
  }

  if (typeof row.id === "string" && row.id.length === 0) {
    row.id = crypto.randomUUID();
  }

  const conflict = options.skipConflictCheck ? null : findConflict(db, table, row);
  if (conflict) return { error: conflict };

  return { row };
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a === "number" || typeof b === "number") {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
  }
  if (typeof a === "object" || typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  if (typeof a === "boolean" || typeof b === "boolean") {
    return Boolean(a) === Boolean(b);
  }
  return String(a) === String(b);
}

/** Unique-constraint check. Returns a Postgres-shaped `23505` error if hit. */
export function findConflict(
  db: MockDatabase,
  table: string,
  row: MockRow,
): RowError | null {
  const meta = getTable(table);
  if (!meta) return null;

  const candidates: { name: string; columns: string[] }[] = [];
  const pk = pkColumns(table);
  if (pk.length) candidates.push({ name: `${table}_pkey`, columns: pk });
  for (const columns of meta.uniqueConstraints) {
    if (!candidates.some((c) => c.columns.join(",") === columns.join(","))) {
      candidates.push({ name: `${table}_${columns.join("_")}_key`, columns });
    }
  }

  const existing = rowsOf(db, table);
  for (const candidate of candidates) {
    const values = candidate.columns.map((c) => row[c]);
    // NULLs never conflict (Postgres: DISTINCT nulls)
    if (values.some((v) => v === null || v === undefined)) continue;

    const clash = existing.find((r) => {
      // A row never conflicts with itself (UPDATE / upsert-merge)
      if (row.id !== undefined && r.id !== undefined && valuesEqual(row.id, r.id)) return false;
      return candidate.columns.every((c, i) => valuesEqual(r[c], values[i]));
    });
    if (clash) {
      return {
        message: `duplicate key value violates unique constraint "${candidate.name}"`,
        code: "23505",
      };
    }
  }
  return null;
}

/** Insert a row, mutating `db`. Caller is responsible for persisting. */
export function insertRow(
  db: MockDatabase,
  table: string,
  payload: MockRow,
): { row: MockRow } | { error: RowError } {
  const built = buildRow(db, table, payload);
  if ("error" in built) return built;
  rowsOf(db, table).push(built.row);
  return { row: built.row };
}

/**
 * Conflict target for `.upsert()` when the caller didn't pass `onConflict`:
 * the primary key when the payload carries it, otherwise the first unique
 * constraint the payload fully covers (this is how `nav_layouts` upserts by
 * `user_id`, for example).
 */
export function inferConflictColumns(meta: MockTable, payload: MockRow): string[] | null {
  const pk = meta.columns.filter((c) => c.pk).map((c) => c.name);
  if (pk.length && pk.every((c) => payload[c] !== undefined)) return pk;
  for (const columns of meta.uniqueConstraints) {
    if (columns.every((c) => payload[c] !== undefined)) return columns;
  }
  return null;
}

/** Values equal under Postgres UNIQUE semantics (NULLs are distinct). */
export function uniqueValuesEqual(a: unknown, b: unknown): boolean {
  return valuesEqual(a, b);
}

export function touchUpdatedAt(db: MockDatabase, table: string, row: MockRow): void {
  if (hasColumn(table, "updated_at")) {
    row.updated_at = new Date().toISOString();
  }
  void db;
}

export function tableMeta(table: string): MockTable | null {
  return getTable(table);
}

export function knownColumnNames(table: string): string[] {
  return columnsOf(table).map((c) => c.name);
}

/** Shape the auth user record for supabase-js's `auth` responses. */
export function toMockAuthUser(record: MockAuthUserRecord): MockUser {
  return {
    id: record.id,
    aud: "authenticated",
    role: "authenticated",
    email: record.email,
    email_confirmed_at: record.created_at,
    phone: null,
    created_at: record.created_at,
    updated_at: new Date().toISOString(),
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    identities: [],
    is_anonymous: false,
  };
}
