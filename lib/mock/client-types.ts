/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The type of the mock Supabase client.
 *
 * Declared with type-only imports so this module stays bundle-neutral: it is
 * imported by client components too (through `@supabase/supabase-js`'s
 * `SupabaseClient` type), and none of the server-only modules it references
 * survive compilation.
 */
import type { MockAuth } from "@/lib/mock/auth";
import type { MockQuery } from "@/lib/mock/query";
import type { MockRpc } from "@/lib/mock/rpc";
import type { createMockStorage } from "@/lib/mock/storage";

export type MockSupabaseClient = {
  auth: MockAuth;
  from: (table: string) => MockQuery;
  rpc: (name: string, args?: Record<string, any>) => MockRpc;
  storage: ReturnType<typeof createMockStorage>;
  /** Present on the real client; never used by the app. */
  rest?: unknown;
};
