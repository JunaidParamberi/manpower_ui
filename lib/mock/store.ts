/**
 * Server-side access to the mock database.
 *
 * The store is a `globalThis` singleton (one per Node process) backed by
 * `mock-db.json` in the project root, so creates/edits/deletes survive page
 * refreshes, server restarts and deployments of the demo itself. Delete the
 * file and restart the dev server to reset every workspace to the seed.
 *
 * Server-only: imports `node:fs` through `db.ts`.
 */
import {
  emptyDatabase,
  readDatabase,
  writeDatabase,
  type MockAuthUserRecord,
  type MockDatabase,
} from "@/lib/mock/db";
import { seedWorkspace } from "@/lib/mock/seed";
import { decodeSession, SESSION_COOKIE } from "@/lib/mock/session";
import { nameFromEmail, userIdForEmail } from "@/lib/mock/user-id";

const GLOBAL_KEY = "__manpower_mock_database__";

export function getDb(): MockDatabase {
  const holder = globalThis as Record<string, unknown>;
  const cached = holder[GLOBAL_KEY] as MockDatabase | undefined;
  if (cached) return cached;
  const db = readDatabase() ?? emptyDatabase();
  holder[GLOBAL_KEY] = db;
  return db;
}

export function persist(): void {
  writeDatabase(getDb());
}

export type EnsureUserOptions = {
  /** Better Auth user id. New workspaces are keyed by this id. */
  id?: string;
  /** Pass `null` explicitly to leave the display name empty (sign-up flow). */
  fullName?: string | null;
  /** true when the account still has to walk through /onboarding. */
  onboardingComplete?: boolean;
};

function rekeyMockUser(db: MockDatabase, fromId: string, toId: string): void {
  const user = db.users.find((row) => row.id === fromId);
  if (!user || fromId === toId) return;
  user.id = toId;
  for (const [table, rows] of Object.entries(db.tables)) {
    for (const row of rows) {
      if (row.user_id === fromId) row.user_id = toId;
      if (table === "profiles" && row.id === fromId) row.id = toId;
    }
  }
}

/**
 * Find (or lazily create) the account + demo workspace for an email. Called
 * whenever a server request carries a session cookie, which is how a brand-new
 * email can log in and immediately land on a fully populated dashboard.
 */
export function ensureUser(email: string, options: EnsureUserOptions = {}): MockAuthUserRecord {
  const normalized = email.trim().toLowerCase();
  const db = getDb();

  if (options.id) {
    const byId = db.users.find((user) => user.id === options.id);
    if (byId) return byId;
  }

  const existing = db.users.find((user) => user.email === normalized);
  if (existing) {
    if (options.id && existing.id !== options.id) {
      rekeyMockUser(db, existing.id, options.id);
      persist();
    }
    return existing;
  }

  const record: MockAuthUserRecord = {
    id: options.id ?? userIdForEmail(normalized),
    email: normalized,
    created_at: new Date().toISOString(),
  };

  db.users.push(record);
  seedWorkspace({
    db,
    userId: record.id,
    email: normalized,
    fullName: options.fullName !== undefined ? options.fullName : nameFromEmail(normalized),
    onboardingComplete: options.onboardingComplete ?? true,
  });
  persist();
  return record;
}

export function findUserByEmail(email: string): MockAuthUserRecord | null {
  return getDb().users.find((user) => user.email === email.trim().toLowerCase()) ?? null;
}

export function findUserById(id: string): MockAuthUserRecord | null {
  return getDb().users.find((user) => user.id === id) ?? null;
}

export type ServerSession = {
  email: string;
  userId: string;
  needsOnboarding: boolean;
  user: MockAuthUserRecord;
};

/**
 * Read the session cookie from the request and make sure the account exists.
 *
 * Safe to call outside a request context (e.g. inside an `unstable_cache`
 * worker): `next/headers` throws there, which we swallow and treat as
 * "anonymous" — those workers are always handed a `userId` explicitly anyway.
 */
export async function currentServerSession(): Promise<ServerSession | null> {
  try {
    const { getRequestAuthUser } = await import("@/lib/auth/request-user");
    const authUser = await getRequestAuthUser();
    if (authUser?.email) {
      const user = ensureUser(authUser.email, {
        id: authUser.id,
        fullName: null,
        onboardingComplete: false,
      });
      return {
        email: user.email,
        userId: user.id,
        needsOnboarding: false,
        user,
      };
    }
  } catch {
    // No request scope, or D1 is unavailable. Fall through to the mock cookie.
  }

  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const payload = decodeSession(jar.get(SESSION_COOKIE)?.value);
    if (!payload) return null;

    const user = ensureUser(payload.e, {
      onboardingComplete: payload.w === 0,
      fullName: undefined,
    });
    return {
      email: payload.e,
      userId: user.id,
      needsOnboarding: payload.w === 1,
      user,
    };
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget variant used by `createAdminClient()`, which is synchronous.
 * Ordering is not critical: the layout's `createClient()` call has already
 * provisioned the account by the time an admin query runs in request scope.
 */
export function provisionFromCookiesInBackground(): void {
  void currentServerSession();
}
