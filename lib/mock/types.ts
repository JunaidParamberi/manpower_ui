/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Types shared by the mock data layer.
 *
 * The mock client mirrors the supabase-js API surface closely enough that the
 * app's 100+ query modules and 60 server actions work unchanged. Result shapes
 * are deliberately loose (`data: any`) because the app was written against an
 * untyped SupabaseClient, where every select returns `any`.
 */

export type MockError = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
};

/**
 * Result shapes, matched field-for-field against what `@supabase/supabase-js`
 * v2 actually infers for an untyped client (probed against v2.105.4):
 *
 *  - `.select(…)`                → `data: any[] | null`
 *  - `.single() / .maybeSingle()` → `data: any`
 *  - a mutation without `.select()` → `data: null`
 *  - `.rpc(…)`                   → `data: any`
 *
 * Getting these exactly right is what keeps the app's 500+ query call sites
 * compiling without edits: `any[] | null` gives `.map((row) => …)` callbacks
 * their contextual type, while `any` keeps property access on single-row
 * results legal.
 */
export type MockSelectResult = {
  data: any[] | null;
  error: MockError | null;
  count?: number | null;
};

export type MockSingleResult = {
  data: any;
  error: MockError | null;
  count?: number | null;
};

export type MockNoneResult = {
  data: null;
  error: MockError | null;
  count?: number | null;
};

export type MockResult = MockSelectResult | MockSingleResult | MockNoneResult;

/** RPC results mirror `.single()`: `data: any`, because the shape is function-defined. */
export type MockRpcResult = {
  data: any;
  error: MockError | null;
  count?: number | null;
};

/** Storage errors, shaped like storage-js's `StorageError`. */
export type MockStorageError = {
  message: string;
  statusCode?: string;
  error?: string;
};

export type MockCountType = "exact" | "estimated" | "planned";

export type MockSelectOptions = {
  count?: MockCountType;
  head?: boolean;
  referencedTable?: string;
  foreignTable?: string;
};

export type MockUpsertOptions = {
  onConflict?: string;
  ignoreDuplicates?: boolean;
  defaultToNull?: boolean;
};

export type MockDeleteOptions = {
  count?: MockCountType;
};

export type MockInsertOptions = {
  count?: MockCountType;
  defaultToNull?: boolean;
};

export type MockOrderOptions = {
  ascending?: boolean;
  nullsFirst?: boolean;
  foreignTable?: string;
  referencedTable?: string;
};

export type MockFilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "like"
  | "ilike"
  | "is"
  | "in"
  | "cs"
  | "cd"
  | "ov"
  | "sl"
  | "sr";

export type MockFilter = {
  /** Column path, possibly dotted for embedded tables (`projects.user_id`). */
  column: string;
  operator: MockFilterOperator;
  value: unknown;
};

export type MockOrGroup = {
  /** Parsed `.or()` clause: groups of AND-ed filters joined at the top level by OR. */
  branches: MockFilter[][];
};

export type MockOrder = {
  column: string;
  ascending: boolean;
  nullsFirst?: boolean;
};

/** A row as stored in the mock database. */
export type MockRow = Record<string, any>;

export type MockSession = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: MockUser;
};

export type MockUser = {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  identities: unknown[];
  is_anonymous: boolean;
};

export type MockCookieStore = {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options?: unknown) => void;
  delete: (name: string) => void;
};
