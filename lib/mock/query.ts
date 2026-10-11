/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PostgREST-shaped query builder over `mock-db.json`.
 *
 * Implements exactly the surface the app calls: filters (`eq/neq/gt/gte/lt/
 * lte/like/ilike/is/in/or/not`), ordering, `limit/range`, `single/maybeSingle`,
 * `count: "exact"` + `head`, the four mutations, embedded joins resolved from
 * the migration-derived schema, and the two RPCs. Awaiting the builder yields
 * the usual `{ data, error, count }`.
 *
 * Server-only (imports the JSON store).
 */
import {
  buildRow,
  findConflict,
  inferConflictColumns,
  rowsOf,
  uniqueValuesEqual,
  type RowError,
} from "@/lib/mock/db";
import { columnsOf, getTable, hasColumn, type MockForeignKey, type MockTable } from "@/lib/mock/schema";
import { getDb, persist } from "@/lib/mock/store";
import type {
  MockDeleteOptions,
  MockFilter,
  MockFilterOperator,
  MockNoneResult,
  MockOrder,
  MockResult,
  MockRow,
  MockSelectOptions,
  MockSelectResult,
  MockSingleResult,
  MockUpsertOptions,
} from "@/lib/mock/types";

// ── helpers ────────────────────────────────────────────────────────────────

const isTable = (name: string): boolean => getTable(name) !== null;

/** Split on top-level commas, ignoring commas inside parens or quotes. */
export function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inQuotes = false;
  let current = "";

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === "\\" && i + 1 < input.length) {
        current += ch + input[i + 1];
        i += 1;
        continue;
      }
      if (ch === '"') inQuotes = false;
      current += ch;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      current += ch;
      continue;
    }
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.length) parts.push(current);
  return parts;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"');
  }
  return trimmed;
}

export function looseEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) return false;
  if (typeof a === "object" || typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  if (typeof a === "number" || typeof b === "number") {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na === nb;
  }
  return String(a) === String(b);
}

function compareValues(a: any, b: any): number {
  const na = Number(a);
  const nb = Number(b);
  const bothNumeric =
    a !== "" &&
    b !== "" &&
    !Number.isNaN(na) &&
    !Number.isNaN(nb) &&
    typeof a !== "boolean" &&
    typeof b !== "boolean";
  if (bothNumeric) return na < nb ? -1 : na > nb ? 1 : 0;
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

function likeRegex(pattern: string, caseInsensitive: boolean): RegExp {
  let out = "";
  for (const ch of pattern) {
    if (ch === "%") out += "[\\s\\S]*";
    else if (ch === "_") out += "[\\s\\S]";
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`, caseInsensitive ? "i" : "");
}

function compareFilter(value: unknown, operator: MockFilterOperator, expected: unknown): boolean {
  const isNull = value === null || value === undefined;

  switch (operator) {
    case "eq":
      // Forgiving: `.eq(col, null)` is treated as `.is(col, null)` so that
      // rows written without the column still match the way callers expect.
      if (expected === null || expected === undefined) return isNull;
      return !isNull && looseEquals(value, expected);
    case "neq":
      if (expected === null || expected === undefined) return !isNull;
      return !isNull && !looseEquals(value, expected);
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      if (isNull || expected === null || expected === undefined) return false;
      const cmp = compareValues(value, expected);
      if (operator === "gt") return cmp > 0;
      if (operator === "gte") return cmp >= 0;
      if (operator === "lt") return cmp < 0;
      return cmp <= 0;
    }
    case "like":
    case "ilike": {
      if (isNull || typeof expected !== "string") return false;
      try {
        return likeRegex(expected, operator === "ilike").test(String(value));
      } catch {
        return false;
      }
    }
    case "is": {
      if (expected === null || expected === undefined) return isNull;
      if (isNull) return false;
      if (typeof expected === "boolean") return Boolean(value) === expected;
      return looseEquals(value, expected);
    }
    case "in": {
      if (isNull || !Array.isArray(expected)) return false;
      return expected.some((candidate) => looseEquals(value, candidate));
    }
    case "cs":
    case "cd": {
      if (isNull || !Array.isArray(expected)) return false;
      const list = Array.isArray(value) ? value : [];
      return operator === "cs"
        ? expected.every((v) => list.some((item) => looseEquals(item, v)))
        : list.some((v) => expected.some((item) => looseEquals(item, v)));
    }
    case "ov": {
      if (isNull || !Array.isArray(expected) || !Array.isArray(value)) return false;
      return value.some((v) => expected.some((item) => looseEquals(item, v)));
    }
    default:
      return isNull ? false : looseEquals(value, expected);
  }
}

// ── relationships / embeds ────────────────────────────────────────────────

type Relation = { kind: "parent" | "child"; fk: MockForeignKey };

/**
 * How `target` is reached from `parent`:
 *  - "parent": the parent row holds the FK  (`documents.client_id → clients`)
 *  - "child": the target rows hold the FK   (`tasks.project_id → projects`)
 * A `!constraint_name` or `alias:column` hint wins when both are possible.
 */
function resolveRelation(parent: string, target: string, hint: string | null): Relation | null {
  const parentMeta = getTable(parent);
  const targetMeta = getTable(target);
  if (!parentMeta || !targetMeta) return null;

  if (hint && hint !== "inner") {
    const onParent = parentMeta.foreignKeys.find((fk) => fk.name === hint);
    if (onParent && onParent.refTable === target) return { kind: "parent", fk: onParent };
    const onTarget = targetMeta.foreignKeys.find((fk) => fk.name === hint);
    if (onTarget && onTarget.refTable === parent) return { kind: "child", fk: onTarget };
    const byColumn = parentMeta.foreignKeys.find(
      (fk) => fk.columns.includes(hint) && fk.refTable === target,
    );
    if (byColumn) return { kind: "parent", fk: byColumn };
  }

  const asParent = parentMeta.foreignKeys.find((fk) => fk.refTable === target);
  if (asParent) return { kind: "parent", fk: asParent };

  const asChild = targetMeta.foreignKeys.find((fk) => fk.refTable === parent);
  if (asChild) return { kind: "child", fk: asChild };

  return null;
}

function relatedRows(
  db: ReturnType<typeof getDb>,
  parent: string,
  row: MockRow,
  target: string,
  hint: string | null,
): MockRow[] {
  const relation = resolveRelation(parent, target, hint);
  if (!relation) return [];

  if (relation.kind === "parent") {
    const values = relation.fk.columns.map((c) => row[c]);
    if (values.some((v) => v === null || v === undefined)) return [];
    const candidates = rowsOf(db, target);
    const match = candidates.find((candidate) =>
      relation.fk.refColumns.every((rc, i) => looseEquals(candidate[rc], values[i])),
    );
    return match ? [match] : [];
  }

  const values = relation.fk.refColumns.map((c) => row[c]);
  if (values.some((v) => v === null || v === undefined)) return [];
  return rowsOf(db, target).filter((candidate) =>
    relation.fk.columns.every((c, i) => looseEquals(candidate[c], values[i])),
  );
}

// ── select-string parsing ─────────────────────────────────────────────────

type SelectSegment =
  | { type: "star" }
  | { type: "column"; name: string }
  | {
      type: "embed";
      alias: string | null;
      table: string;
      hint: string | null;
      fields: string;
      aggregate: boolean;
    };

const selectCache = new Map<string, SelectSegment[]>();

function parseSelect(columns: string): SelectSegment[] {
  const cached = selectCache.get(columns);
  if (cached) return cached;

  const segments = splitTopLevel(columns)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((token): SelectSegment => {
      if (token === "*") return { type: "star" };

      const open = token.indexOf("(");
      const close = token.lastIndexOf(")");
      if (open === -1 || close < open) return { type: "column", name: unquote(token) };

      const prefix = token.slice(0, open).trim();
      const fields = token.slice(open + 1, close).trim();

      let alias: string | null = null;
      let hint: string | null = null;
      let namePart = prefix;

      const bang = namePart.indexOf("!");
      if (bang !== -1) {
        hint = namePart.slice(bang + 1).trim();
        namePart = namePart.slice(0, bang).trim();
      }
      const colon = namePart.indexOf(":");
      if (colon !== -1) {
        const left = namePart.slice(0, colon).trim();
        const right = namePart.slice(colon + 1).trim();
        if (isTable(left)) {
          // `clients:client_id(...)` → table with a FK-column hint
          namePart = left;
          hint = right;
        } else {
          alias = left;
          namePart = right;
        }
      }

      if (!isTable(namePart)) return { type: "column", name: unquote(token) };

      return {
        type: "embed",
        alias,
        table: namePart,
        hint,
        fields,
        aggregate: fields === "count" || fields.startsWith("count("),
      };
    });

  selectCache.set(columns, segments);
  return segments;
}

function projectRow(
  db: ReturnType<typeof getDb>,
  parentTable: string,
  row: MockRow,
  columns: string,
): MockRow {
  const out: MockRow = {};
  for (const segment of parseSelect(columns)) {
    if (segment.type === "star") {
      for (const [key, value] of Object.entries(row)) out[key] = value;
      continue;
    }
    if (segment.type === "column") {
      out[segment.name] = row[segment.name] ?? null;
      continue;
    }

    const related = relatedRows(db, parentTable, row, segment.table, segment.hint);
    const key = segment.alias ?? segment.table;
    if (segment.aggregate) {
      out[key] = [{ count: related.length }];
      continue;
    }
    const inner = segment.fields === "*" ? "*" : segment.fields;
    const projected = related.map((relatedRow) => projectRow(db, segment.table, relatedRow, inner));
    const relation = resolveRelation(parentTable, segment.table, segment.hint);
    out[key] = relation?.kind === "parent" ? (projected[0] ?? null) : projected;
  }
  return out;
}

// ── `.or()` / `.not()` clause parsing ─────────────────────────────────────

function parseCondition(token: string): MockFilter {
  const trimmed = token.trim();
  const firstDot = trimmed.indexOf(".");
  if (firstDot === -1) return { column: unquote(trimmed), operator: "eq", value: true };

  const column = unquote(trimmed.slice(0, firstDot));
  const rest = trimmed.slice(firstDot + 1);
  const secondDot = rest.indexOf(".");
  if (secondDot === -1) {
    return { column, operator: "eq", value: unquote(rest) };
  }

  const operator = rest.slice(0, secondDot).toLowerCase() as MockFilterOperator;
  const rawValue = rest.slice(secondDot + 1);

  if (operator === "in" || operator === "cs" || operator === "cd" || operator === "ov") {
    const inner = rawValue.trim();
    const body = inner.startsWith("(") && inner.endsWith(")") ? inner.slice(1, -1) : inner;
    const values = splitTopLevel(body)
      .map((v) => unquote(v.trim()))
      .filter((v) => v.length > 0);
    return { column, operator, value: values };
  }

  if (operator === "is" && /^null$/i.test(rawValue.trim())) {
    return { column, operator, value: null };
  }

  if (operator === "eq" || operator === "neq") {
    const value = unquote(rawValue);
    if (/^null$/i.test(value)) return { column, operator, value: null };
    if (/^true$/i.test(value)) return { column, operator, value: true };
    if (/^false$/i.test(value)) return { column, operator, value: false };
    return { column, operator, value };
  }

  return { column, operator, value: unquote(rawValue) };
}

/** PostgREST `or=(a.eq.1,b.eq.2),c.eq.3` → OR of AND-groups. */
function parseOrClause(clause: string): MockFilter[][] {
  return splitTopLevel(clause).map((token) => {
    const trimmed = token.trim();
    if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
      const inner = trimmed.slice(1, -1);
      const conditions = splitTopLevel(inner).map(parseCondition);
      return conditions.length ? conditions : [parseCondition(trimmed)];
    }
    return [parseCondition(trimmed)];
  });
}

function matchFilter(
  db: ReturnType<typeof getDb>,
  table: string,
  row: MockRow,
  filter: MockFilter,
): boolean {
  const dot = filter.column.indexOf(".");
  if (dot !== -1) {
    const head = filter.column.slice(0, dot);
    const rest = filter.column.slice(dot + 1);
    const related = relatedRows(db, table, row, head, null);
    return related.some((relatedRow) =>
      matchFilter(db, head, relatedRow, { ...filter, column: rest }),
    );
  }
  return compareFilter(row[filter.column], filter.operator, filter.value);
}

function compareForOrder(a: unknown, b: unknown, order: MockOrder): number {
  const aNull = a === null || a === undefined;
  const bNull = b === null || b === undefined;
  if (aNull || bNull) {
    if (aNull && bNull) return 0;
    const nullsFirst = order.nullsFirst ?? !order.ascending;
    if (aNull) return nullsFirst ? -1 : 1;
    return nullsFirst ? 1 : -1;
  }
  const cmp = compareValues(a, b);
  return order.ascending ? cmp : -cmp;
}

function errorMessage(error: RowError): MockResult {
  return { data: null, error: { message: error.message, code: error.code } };
}

function pgrst116(rows: number): MockResult {
  return {
    data: null,
    error: {
      message: "JSON object requested, multiple rows returned",
      code: "PGRST116",
      details: `Results contain ${rows} rows`,
    },
  };
}

// ── builder ───────────────────────────────────────────────────────────────

type MutationKind = "select" | "insert" | "update" | "upsert" | "delete";

export class MockQuery<R = MockSelectResult> implements PromiseLike<R> {
  private readonly table: string;
  private kind: MutationKind = "select";
  private payload: any = null;
  private columns: string | null = null;
  private selectOptions: MockSelectOptions = {};
  private filters: MockFilter[] = [];
  private orBranches: MockFilter[][] = [];
  private orders: MockOrder[] = [];
  private limitValue: number | null = null;
  private rangeValue: [number, number] | null = null;
  private rowMode: "many" | "single" | "maybe" = "many";
  private upsertOptions: MockUpsertOptions = {};
  private deleteOptions: MockDeleteOptions = {};
  private pending: Promise<R> | null = null;

  constructor(table: string) {
    this.table = table;
  }

  // ── mutations ──
  //
  // The generic parameter mirrors the shape supabase-js would infer, so call
  // sites keep their contextual typing: a bare mutation resolves to
  // `data: null`, `.select()` back to `any[] | null`, `.single()` to `any`.

  select(columns?: string, options: MockSelectOptions = {}): MockQuery<MockSelectResult> {
    this.columns = columns ?? "*";
    this.selectOptions = options ?? {};
    return this as unknown as MockQuery<MockSelectResult>;
  }

  insert(values: any, _options?: Record<string, unknown>): MockQuery<MockNoneResult> {
    this.kind = "insert";
    this.payload = values;
    return this as unknown as MockQuery<MockNoneResult>;
  }

  upsert(values: any, options: MockUpsertOptions = {}): MockQuery<MockNoneResult> {
    this.kind = "upsert";
    this.payload = values;
    this.upsertOptions = options ?? {};
    return this as unknown as MockQuery<MockNoneResult>;
  }

  update(values: any): MockQuery<MockNoneResult> {
    this.kind = "update";
    this.payload = values;
    return this as unknown as MockQuery<MockNoneResult>;
  }

  delete(options: MockDeleteOptions = {}): MockQuery<MockNoneResult> {
    this.kind = "delete";
    this.deleteOptions = options ?? {};
    return this as unknown as MockQuery<MockNoneResult>;
  }

  // ── filters ──

  eq(column: string, value: unknown): this {
    this.filters.push({ column, operator: "eq", value });
    return this;
  }

  neq(column: string, value: unknown): this {
    this.filters.push({ column, operator: "neq", value });
    return this;
  }

  gt(column: string, value: unknown): this {
    this.filters.push({ column, operator: "gt", value });
    return this;
  }

  gte(column: string, value: unknown): this {
    this.filters.push({ column, operator: "gte", value });
    return this;
  }

  lt(column: string, value: unknown): this {
    this.filters.push({ column, operator: "lt", value });
    return this;
  }

  lte(column: string, value: unknown): this {
    this.filters.push({ column, operator: "lte", value });
    return this;
  }

  like(column: string, pattern: string): this {
    this.filters.push({ column, operator: "like", value: pattern });
    return this;
  }

  ilike(column: string, pattern: string): this {
    this.filters.push({ column, operator: "ilike", value: pattern });
    return this;
  }

  is(column: string, value: boolean | null): this {
    this.filters.push({ column, operator: "is", value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push({ column, operator: "in", value: values ?? [] });
    return this;
  }

  contains(column: string, value: unknown): this {
    this.filters.push({ column, operator: "cs", value });
    return this;
  }

  match(query: Record<string, unknown>): this {
    for (const [column, value] of Object.entries(query)) this.eq(column, value);
    return this;
  }

  filter(column: string, operator: string, value: unknown): this {
    this.filters.push({ column, operator: operator as MockFilterOperator, value });
    return this;
  }

  or(clause: string): this {
    this.orBranches.push(...parseOrClause(clause));
    return this;
  }

  not(column: string, operator: string, value: unknown): this {
    const op = operator as MockFilterOperator;
    if (op === "is" && value === null) {
      this.filters.push({ column, operator: "neq", value: null });
      return this;
    }
    if (op === "eq") return this.neq(column, value);
    if (op === "neq") return this.eq(column, value);
    this.filters.push({ column, operator: op, value });
    return this;
  }

  // ── shaping ──

  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}): this {
    this.orders.push({
      column,
      ascending: options.ascending ?? true,
      nullsFirst: options.nullsFirst,
    });
    return this;
  }

  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number): this {
    this.rangeValue = [from, to];
    return this;
  }

  single(): MockQuery<MockSingleResult> {
    this.rowMode = "single";
    return this as unknown as MockQuery<MockSingleResult>;
  }

  maybeSingle(): MockQuery<MockSingleResult> {
    this.rowMode = "maybe";
    return this as unknown as MockQuery<MockSingleResult>;
  }

  /** No-ops kept so callers written against supabase-js still type-check. */
  abortSignal(_signal: AbortSignal): this {
    return this;
  }

  throwOnError(): this {
    return this;
  }

  then<TResult1 = R, TResult2 = never>(
    onfulfilled?: ((value: R) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    this.pending ??= this.run() as Promise<R>;
    return this.pending.then(onfulfilled, onrejected);
  }

  // ── execution ──

  private async run(): Promise<MockResult> {
    try {
      const db = getDb();
      if (!getTable(this.table)) {
        return { data: null, error: { message: `relation "${this.table}" does not exist`, code: "42P01" } };
      }
      switch (this.kind) {
        case "insert":
          return this.runInsert(db);
        case "upsert":
          return this.runUpsert(db);
        case "update":
          return this.runUpdate(db);
        case "delete":
          return this.runDelete(db);
        default:
          return this.runSelect(db);
      }
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : String(error), code: "XX000" },
      };
    }
  }

  private matching(db: ReturnType<typeof getDb>): MockRow[] {
    return rowsOf(db, this.table).filter((row) => {
      for (const filter of this.filters) {
        if (!matchFilter(db, this.table, row, filter)) return false;
      }
      if (this.orBranches.length) {
        const anyBranch = this.orBranches.some((branch) =>
          branch.every((filter) => matchFilter(db, this.table, row, filter)),
        );
        if (!anyBranch) return false;
      }
      return true;
    });
  }

  private shape(rows: MockRow[], count: number | null): MockResult {
    const columns = this.columns ?? "*";

    if (this.selectOptions.head) {
      return { data: null, error: null, count };
    }

    if (this.rowMode === "many") {
      return { data: rows.map((row) => projectRow(getDb(), this.table, row, columns)), error: null, count };
    }
    if (rows.length === 0) {
      if (this.rowMode === "maybe") return { data: null, error: null, count };
      return { ...pgrst116(0), count };
    }
    if (rows.length > 1) {
      return { ...pgrst116(rows.length), count };
    }
    return { data: projectRow(getDb(), this.table, rows[0], columns), error: null, count };
  }

  private runSelect(db: ReturnType<typeof getDb>): MockResult {
    const matched = this.matching(db);
    const count = this.selectOptions.count ? matched.length : null;

    if (this.selectOptions.head) {
      return { data: null, error: null, count };
    }

    let rows = matched;
    if (this.orders.length) {
      rows = [...rows].sort((a, b) => {
        for (const order of this.orders) {
          const cmp = compareForOrder(a[order.column], b[order.column], order);
          if (cmp !== 0) return cmp;
        }
        return 0;
      });
    }
    if (this.rangeValue) {
      const [from, to] = this.rangeValue;
      rows = rows.slice(from, to + 1);
    }
    if (this.limitValue !== null) rows = rows.slice(0, this.limitValue);

    return this.shape(rows, count);
  }

  private runInsert(db: ReturnType<typeof getDb>): MockResult {
    const payloads: MockRow[] = Array.isArray(this.payload) ? this.payload : [this.payload];
    const built: MockRow[] = [];

    for (const payload of payloads) {
      const result = buildRow(db, this.table, payload ?? {});
      if ("error" in result) return errorMessage(result.error);
      built.push(result.row);
    }
    rowsOf(db, this.table).push(...built);
    persist();

    if (this.columns === null) return { data: null, error: null, count: built.length };
    return this.shape(built, built.length);
  }

  private runUpsert(db: ReturnType<typeof getDb>): MockResult {
    const meta = getTable(this.table) as MockTable;
    const payloads: MockRow[] = Array.isArray(this.payload) ? this.payload : [this.payload];
    const affected: MockRow[] = [];
    const tableRows = rowsOf(db, this.table);

    for (const payload of payloads) {
      const built = buildRow(db, this.table, payload ?? {}, { skipConflictCheck: true });
      if ("error" in built) return errorMessage(built.error);

      const conflictColumns =
        (this.upsertOptions.onConflict
          ? this.upsertOptions.onConflict.split(",").map((c) => c.trim()).filter(Boolean)
          : null) ?? inferConflictColumns(meta, built.row) ?? [];

      let existing: MockRow | undefined;
      if (conflictColumns.length && !conflictColumns.some((c) => built.row[c] == null)) {
        existing = tableRows.find((row) =>
          conflictColumns.every((column) => uniqueValuesEqual(row[column], built.row[column])),
        );
      }

      if (existing) {
        if (this.upsertOptions.ignoreDuplicates) {
          affected.push(existing);
          continue;
        }
        const payloadKeys = Object.keys(payload ?? {}).filter((key) => payload?.[key] !== undefined);
        const merged: MockRow = { ...existing };
        for (const key of payloadKeys) merged[key] = built.row[key];
        if (hasColumn(this.table, "updated_at")) merged.updated_at = new Date().toISOString();
        const conflict = findConflict(db, this.table, merged);
        if (conflict) return errorMessage(conflict);
        Object.assign(existing, merged);
        affected.push(existing);
        continue;
      }

      const conflict = findConflict(db, this.table, built.row);
      if (conflict) return errorMessage(conflict);
      tableRows.push(built.row);
      affected.push(built.row);
    }

    persist();
    if (this.columns === null) return { data: null, error: null, count: affected.length };
    return this.shape(affected, affected.length);
  }

  private runUpdate(db: ReturnType<typeof getDb>): MockResult {
    const targets = this.matching(db);
    if (!targets.length) {
      const count = this.selectOptions.count ? 0 : null;
      if (this.columns === null) return { data: null, error: null, count };
      return { data: [], error: null, count };
    }

    const payload = this.payload ?? {};
    const built = buildRow(db, this.table, payload, { skipConflictCheck: true });
    if ("error" in built) return errorMessage(built.error);
    const keys = Object.keys(payload).filter((key) => payload[key] !== undefined);

    for (const target of targets) {
      const merged: MockRow = { ...target };
      for (const key of keys) merged[key] = built.row[key];
      if (hasColumn(this.table, "updated_at")) merged.updated_at = new Date().toISOString();
      const conflict = findConflict(db, this.table, merged);
      if (conflict) return errorMessage(conflict);
      Object.assign(target, merged);
    }

    persist();
    const count = this.selectOptions.count ? targets.length : null;
    if (this.columns === null) return { data: null, error: null, count };
    return this.shape(targets, count);
  }

  private runDelete(db: ReturnType<typeof getDb>): MockResult {
    const targets = this.matching(db);
    const tableRows = rowsOf(db, this.table);
    const removed = tableRows.filter((row) => targets.includes(row));
    if (removed.length) {
      db.tables[this.table] = tableRows.filter((row) => !targets.includes(row));
      persist();
    }

    const count = this.deleteOptions.count || this.selectOptions.count ? removed.length : null;
    if (this.columns === null) return { data: null, error: null, count };
    if (this.selectOptions.head) return { data: null, error: null, count };
    return this.shape(removed, count);
  }
}

export function createQueryBuilder(table: string): MockQuery {
  return new MockQuery(table);
}

export { columnsOf };
