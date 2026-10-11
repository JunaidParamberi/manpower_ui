/**
 * Table metadata for the mock database.
 *
 * `schema.json` is derived from the original app's SQL migrations: every
 * table, column, default, primary key, foreign key and unique constraint the
 * real database had. The mock query builder uses it to
 *
 *  - fill column defaults on insert (`gen_random_uuid()`, `now()`, `'draft'`),
 *  - resolve embedded joins (`line_items(*)`, `client:clients(name)`),
 *  - pick a conflict target for `.upsert()`,
 *  - surface `23505` on duplicate keys like Postgres would.
 */
import schemaJson from "./schema.json";

export type MockColumn = {
  name: string;
  type: string;
  kind: "uuid" | "timestamp" | "date" | "bool" | "numeric" | "int" | "json" | "text";
  notNull?: boolean;
  pk?: boolean;
  identity?: boolean;
  unique?: boolean;
  default?: string;
};

export type MockForeignKey = {
  name: string;
  columns: string[];
  refTable: string;
  refColumns: string[];
};

export type MockTable = {
  columns: MockColumn[];
  foreignKeys: MockForeignKey[];
  uniqueConstraints: string[][];
};

const schema = schemaJson as unknown as Record<string, MockTable>;

export function listTables(): string[] {
  return Object.keys(schema);
}

export function getTable(name: string): MockTable | null {
  return schema[name] ?? null;
}

export function hasTable(name: string): boolean {
  return Object.hasOwn(schema, name);
}

export function columnsOf(name: string): MockColumn[] {
  return schema[name]?.columns ?? [];
}

export function pkColumns(name: string): string[] {
  return columnsOf(name)
    .filter((c) => c.pk)
    .map((c) => c.name);
}

export function hasColumn(table: string, column: string): boolean {
  return columnsOf(table).some((c) => c.name === column);
}

/** Deterministic-looking UUID for seeded rows. */
export function makeUuid(counter: number): string {
  const hex = counter.toString(16).padStart(12, "0");
  return `0000000${(counter % 16).toString(16)}-0000-4000-80${hex.slice(0, 2)}${hex.slice(2, 6)}-${hex.slice(4)}${(counter % 256).toString(16).padStart(2, "0")}00`;
}

export function randomUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return makeUuid(Math.floor(Math.random() * 0xffffff));
}

function stripCast(value: string): string {
  return value.replace(/\s*::\s*[A-Za-z_][\w.]*(\s*\[\])?(\([^)]*\))?/g, "").trim();
}

function unquote(value: string): string {
  let out = value;
  if (out.startsWith("'") && out.endsWith("'")) {
    out = out.slice(1, -1).replace(/''/g, "'");
  }
  return out;
}

/**
 * Evaluate a column's SQL default literal. Returns `undefined` when the
 * default cannot be expressed statically (a function call we don't emulate),
 * which the caller treats as "no default".
 */
export function evaluateDefault(column: MockColumn, counter: number): unknown {
  const raw = column.default;
  if (raw === undefined) return undefined;

  const value = stripCast(raw);

  if (/^null$/i.test(value)) return null;
  if (/^true$/i.test(value)) return true;
  if (/^false$/i.test(value)) return false;
  if (/^gen_random_uuid\(\)$/i.test(value)) return randomUuid();
  if (/^now\(\)$/i.test(value) || /^current_timestamp$/i.test(value)) {
    return new Date().toISOString();
  }
  if (/^encode\(gen_random_bytes\(\d+\),\s*'hex'\)$/i.test(value)) {
    const bytes = Number(value.match(/\d+/)?.[0] ?? 24);
    let out = "";
    for (let i = 0; i < bytes; i++) {
      out += Math.floor(Math.random() * 256)
        .toString(16)
        .padStart(2, "0");
    }
    return out;
  }
  if (/^nextval\(/i.test(value)) return undefined;

  if (value.startsWith("'")) {
    const text = unquote(value);
    if (column.kind === "json") {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    if (column.kind === "numeric" || column.kind === "int") {
      const n = Number(text);
      return Number.isNaN(n) ? text : n;
    }
    return text;
  }

  if (column.kind === "numeric" || column.kind === "int" || column.kind === "bool") {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }

  // `''` without quotes (empty string default) and anything else unparseable
  if (value === "") return "";
  return undefined;
}

/** Coerce an incoming value to the column's storage type. */
export function coerceToColumn(column: MockColumn, value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;

  switch (column.kind) {
    case "numeric":
    case "int": {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isNaN(n) ? value : n;
    }
    case "bool": {
      if (typeof value === "boolean") return value;
      if (value === "true") return true;
      if (value === "false") return false;
      return Boolean(value);
    }
    case "json": {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    }
    default:
      return value;
  }
}
