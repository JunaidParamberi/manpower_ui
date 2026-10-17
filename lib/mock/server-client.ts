/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The full mock Supabase client used by `lib/supabase/server.ts` and
 * `lib/supabase/admin.ts`: auth + query builder + rpc + storage.
 *
 * Server-only — pulls in the JSON store through the query builder.
 */
import { createMockAuth, type AuthCookieAdapter, type AuthSessionUser } from "@/lib/mock/auth";
import type { MockSupabaseClient } from "@/lib/mock/client-types";
import { createQueryBuilder, type MockQuery } from "@/lib/mock/query";
import { MockRpc } from "@/lib/mock/rpc";
import { createMockStorage } from "@/lib/mock/storage";
import { ensureUser } from "@/lib/mock/store";
import type { MockResult, MockUser } from "@/lib/mock/types";
import { getDb, persist } from "@/lib/mock/store";
import { toMockAuthUser } from "@/lib/mock/db";
import type { ProvisionHook } from "@/lib/mock/auth";

/**
 * Cookie access for server components/actions. `set`/`delete` are wrapped so
 * calls made from a Server Component (where Next forbids cookie writes) fall
 * back to the same "ignore, middleware will refresh" behaviour the original
 * `@supabase/ssr` client had.
 */
export type CookieJar = {
  get: (name: string) => { name?: string; value: string } | undefined;
  set: (name: string, value: string, options?: any) => void;
  delete: (name: string) => void;
};

function adapterFor(jar: CookieJar): AuthCookieAdapter {
  return {
    get: (name) => jar.get(name)?.value,
    set: (name, value, options) => {
      try {
        jar.set(name, value, options);
      } catch {
        /* Server Component — safe to ignore */
      }
    },
    delete: (name) => {
      try {
        jar.delete(name);
      } catch {
        /* Server Component — safe to ignore */
      }
    },
  };
}

/** `auth.admin.*` — service-role operations on the mock store. */
export const adminAuthHooks = {
  async deleteUser(id: string): Promise<MockResult> {
    const db = getDb();
    db.users = db.users.filter((user) => user.id !== id);
    for (const [table, rows] of Object.entries(db.tables)) {
      db.tables[table] = rows.filter((row) => {
        if (row.user_id === id) return false;
        if (table === "profiles" && row.id === id) return false;
        return true;
      });
    }
    persist();
    return { data: { user: { id } }, error: null };
  },

  async getUserById(id: string): Promise<{ data: { user: MockUser | null }; error: any }> {
    const db = getDb();
    const record = db.users.find((user) => user.id === id);
    if (!record) {
      return {
        data: { user: null },
        error: { message: "User not found", code: "404" },
      };
    }
    return { data: { user: toMockAuthUser(record) }, error: null };
  },

  async listUsers(): Promise<MockResult> {
    const db = getDb();
    return { data: { users: db.users.map(toMockAuthUser), page: 0 }, error: null };
  },
};

export function createMockServerClient(
  jar: CookieJar,
  sessionUser?: AuthSessionUser | null,
): MockSupabaseClient {
  const provision: ProvisionHook = (email, options) => ensureUser(email, options);

  const auth = createMockAuth({
    cookies: adapterFor(jar),
    provision,
    sessionUser,
    admin: adminAuthHooks,
  });

  return {
    auth,
    from: (table: string): MockQuery => createQueryBuilder(table),
    rpc: (name: string, args: Record<string, any> = {}) => new MockRpc(name, args),
    storage: createMockStorage(),
  };
}

/** Cookie jar that reads nothing — used for the service-role client. */
export const anonymousJar: CookieJar = {
  get: () => undefined,
  set: () => undefined,
  delete: () => undefined,
};
