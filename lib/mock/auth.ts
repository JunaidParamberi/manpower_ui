/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Mock implementation of the supabase-js `auth` API.
 *
 * Everything is driven by a single session cookie so it works identically in
 * the browser (readable by `document.cookie`) and on the server (readable by
 * Next's `cookies()`). Any credentials sign in — this is a frontend demo, the
 * "backend" is `mock-db.json`.
 *
 * The server client passes a `provision` hook so that signing in with a
 * brand-new email seeds a complete demo workspace on the spot; the browser
 * client can't touch the filesystem, so it derives the same account id
 * deterministically (see `user-id.ts`) and lets the next server request seed.
 */
import type {
  MockError,
  MockResult,
  MockUser,
} from "@/lib/mock/types";
import {
  decodeSession,
  encodeSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/mock/session";
import { nameFromEmail, userIdForEmail } from "@/lib/mock/user-id";

export type AuthCookieAdapter = {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
  delete: (name: string) => void;
};

export type ProvisionHook = (
  email: string,
  options: { onboardingComplete: boolean; fullName?: string | null },
) => { id: string; email: string; created_at: string };

export type AuthSessionUser = {
  id: string;
  email: string;
  created_at: string;
};

export type MockAuthOptions = {
  cookies: AuthCookieAdapter;
  provision?: ProvisionHook;
  /**
   * Server-side Better Auth session. When set, `getUser` / `getClaims` use
   * this identity instead of the legacy mock cookie.
   */
  sessionUser?: AuthSessionUser | null;
  /** Service-role operations; the browser build stubs these out. */
  admin?: {
    deleteUser: (id: string) => Promise<MockResult>;
    getUserById: (id: string) => Promise<{ data: { user: MockUser | null }; error: MockError | null }>;
    listUsers: () => Promise<MockResult>;
  };
};

const PENDING_EMAIL_COOKIE = "mock_pending_email";
const BROWSER_USER_SINCE = "2026-01-01T00:00:00.000Z";

/** The `{ data, error }` envelope supabase-js wraps every auth call in. */
type AuthResult<T = any> = { data: T; error: MockError | null };

const ok = <T>(data: T): AuthResult<T> => ({ data, error: null });
const fail = <T>(message: string, code?: string): AuthResult<T> => ({
  data: null as unknown as T,
  error: { message, code },
});

function recordFor(
  email: string,
  provision: ProvisionHook | undefined,
  onboardingComplete: boolean,
): { id: string; email: string; created_at: string } {
  if (provision) return provision(email, { onboardingComplete });
  return { id: userIdForEmail(email), email, created_at: BROWSER_USER_SINCE };
}

function toUser(record: { id: string; email: string; created_at: string }): MockUser {
  return {
    id: record.id,
    aud: "authenticated",
    role: "authenticated",
    email: record.email,
    email_confirmed_at: record.created_at,
    phone: null,
    created_at: record.created_at,
    updated_at: record.created_at,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    identities: [],
    is_anonymous: false,
  };
}

function sessionFor(user: MockUser): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: `mock.${user.id}.${now}`,
    token_type: "bearer",
    expires_in: SESSION_MAX_AGE_SECONDS,
    expires_at: now + SESSION_MAX_AGE_SECONDS,
    refresh_token: `mock-refresh.${user.id}`,
    user,
  };
}

function readSession(adapter: AuthCookieAdapter) {
  return decodeSession(adapter.get(SESSION_COOKIE));
}

function writeSession(
  adapter: AuthCookieAdapter,
  email: string,
  needsOnboarding: boolean,
): void {
  adapter.set(SESSION_COOKIE, encodeSession(email, needsOnboarding), {
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
}

function looksLikeEmail(value: string): boolean {
  return /.+@.+\..+/.test(value);
}

/** Build the `auth` object returned by both mock clients. */
export function createMockAuth(options: MockAuthOptions) {
  const { cookies: adapter, provision } = options;

  const currentUserRecord = (onboardingComplete: boolean) => {
    if (options.sessionUser) return options.sessionUser;
    const payload = readSession(adapter);
    if (!payload) return null;
    return recordFor(payload.e, provision, onboardingComplete);
  };

  const respondUser = (onboardingComplete = true) => {
    const record = currentUserRecord(onboardingComplete);
    if (!record) {
      return {
        data: { user: null },
        error: { message: "Auth session missing!", code: "missing_session" },
      };
    }
    return ok({ user: toUser(record) });
  };

  return {
    async getUser(): Promise<any> {
      return respondUser();
    },

    async getClaims(): Promise<any> {
      if (options.sessionUser) {
        return ok({
          claims: {
            sub: options.sessionUser.id,
            email: options.sessionUser.email,
            role: "authenticated",
            aud: "authenticated",
          },
        });
      }
      const payload = readSession(adapter);
      if (!payload) return ok({ claims: null });
      const record = recordFor(payload.e, provision, payload.w === 0);
      return ok({
        claims: {
          sub: record.id,
          email: record.email,
          role: "authenticated",
          aud: "authenticated",
          exp: payload.x,
        },
      });
    },

    async getSession(): Promise<any> {
      if (options.sessionUser) {
        const user = toUser(options.sessionUser);
        return ok({ session: sessionFor(user) });
      }
      const payload = readSession(adapter);
      if (!payload) return ok({ session: null });
      const record = recordFor(payload.e, provision, payload.w === 0);
      const user = toUser(record);
      return ok({ session: sessionFor(user) });
    },

    async signInWithPassword(credentials: { email: string; password: string }): Promise<any> {
      const email = (credentials.email ?? "").trim().toLowerCase();
      if (!looksLikeEmail(email) || !credentials.password) {
        return fail("Invalid login credentials", "invalid_credentials");
      }
      writeSession(adapter, email, false);
      const record = recordFor(email, provision, true);
      const user = toUser(record);
      return ok({ user, session: sessionFor(user) });
    },

    async signUp(input: {
      email: string;
      password: string;
      options?: { data?: Record<string, unknown>; emailRedirectTo?: string };
    }): Promise<any> {
      const email = (input.email ?? "").trim().toLowerCase();
      if (!looksLikeEmail(email)) {
        return fail("Email address is invalid", "validation_failed");
      }
      if (!input.password) {
        return fail("Password must be at least 6 characters.", "validation_failed");
      }

      // No session yet (matches Supabase's "confirm your email" behaviour):
      // the cookie only records the pending account so the first server
      // request can seed it with onboarding still outstanding.
      adapter.set(PENDING_EMAIL_COOKIE, email, { path: "/", maxAge: 60 * 60 * 24 });
      writeSession(adapter, email, true);

      const metadata = input.options?.data ?? {};
      const record = recordFor(email, provision, false);
      const user = { ...toUser(record), user_metadata: metadata };
      void nameFromEmail(email);
      return ok({ user, session: sessionFor(user) });
    },

    async signInWithOtp(input: {
      email: string;
      options?: { shouldCreateUser?: boolean; emailRedirectTo?: string; data?: unknown };
    }): Promise<any> {
      const email = (input.email ?? "").trim().toLowerCase();
      if (!looksLikeEmail(email)) {
        return fail("Email address is invalid", "validation_failed");
      }
      adapter.set(PENDING_EMAIL_COOKIE, email, { path: "/", maxAge: 60 * 60 * 24 });
      return ok({ user: null, session: null });
    },

    async signInWithOAuth(input: {
      provider: string;
      options?: { redirectTo?: string; scopes?: string; queryParams?: Record<string, string> };
    }): Promise<any> {
      const payload = readSession(adapter);
      const email = payload?.e ?? adapter.get(PENDING_EMAIL_COOKIE) ?? "google.demo@gmail.com";
      writeSession(adapter, decodeURIComponent(email), false);

      const redirectTo = input.options?.redirectTo ?? "/dashboard";
      if (typeof window !== "undefined") {
        window.location.href = redirectTo;
      }
      return ok({ provider: input.provider, url: redirectTo });
    },

    async signInWithIdToken(input: {
      provider: string;
      /** supabase-js accepts either field name depending on the provider flow. */
      token?: string;
      idToken?: string;
      nonce?: string;
      options?: { redirectTo?: string };
    }): Promise<any> {
      void input.token;
      void input.idToken;
      const payload = readSession(adapter);
      const email = payload?.e ?? "google.demo@gmail.com";
      writeSession(adapter, email, false);
      const redirectTo = input.options?.redirectTo ?? "/dashboard";
      if (typeof window !== "undefined") {
        window.location.href = redirectTo;
      }
      const record = recordFor(email, provision, true);
      const user = toUser(record);
      return ok({ user, session: sessionFor(user) });
    },

    async verifyOtp(input: {
      email?: string;
      token?: string;
      token_hash?: string;
      type?: string;
      phone?: string;
      options?: { redirectTo?: string };
    }): Promise<any> {
      const email = (
        input.email ??
        adapter.get(PENDING_EMAIL_COOKIE) ??
        readSession(adapter)?.e ??
        "demo@manpower.app"
      )
        .trim()
        .toLowerCase();
      if (!looksLikeEmail(email)) {
        return fail("Email address is invalid", "validation_failed");
      }
      writeSession(adapter, email, false);
      adapter.delete(PENDING_EMAIL_COOKIE);
      const record = recordFor(email, provision, true);
      const user = toUser(record);
      return ok({ user, session: sessionFor(user) });
    },

    async exchangeCodeForSession(code: string): Promise<any> {
      const email =
        adapter.get(PENDING_EMAIL_COOKIE) ?? readSession(adapter)?.e ?? "demo@manpower.app";
      void code;
      writeSession(adapter, email, false);
      adapter.delete(PENDING_EMAIL_COOKIE);
      const record = recordFor(email, provision, true);
      const user = toUser(record);
      return ok({ session: sessionFor(user), user });
    },

    async resetPasswordForEmail(
      _email: string,
      _options?: { redirectTo?: string; captchaToken?: string },
    ): Promise<any> {
      return ok({});
    },

    async updateUser(updates: {
      password?: string;
      email?: string;
      emailChangeToken?: string;
      data?: Record<string, unknown>;
    }): Promise<any> {
      const payload = readSession(adapter);
      if (!payload) return fail("Auth session missing!", "missing_session");
      if (updates.password) {
        console.log(`[mock-auth] password updated for ${payload.e}`);
      }
      const record = recordFor(payload.e, provision, payload.w === 0);
      const user = { ...toUser(record), user_metadata: updates.data ?? {} };
      return ok({ user });
    },

    async signOut(_options?: { scope?: string }): Promise<any> {
      adapter.delete(SESSION_COOKIE);
      adapter.delete(PENDING_EMAIL_COOKIE);
      return ok({});
    },

    async isSignedIn(): Promise<boolean> {
      return readSession(adapter) !== null;
    },

    /** Present on the real client; the demo has no MFA enrolment flow. */
    mfa: {
      async enroll(): Promise<any> {
        return fail("Multi-factor auth is not available in the demo.", "unsupported");
      },
      async challenge(): Promise<any> {
        return fail("Multi-factor auth is not available in the demo.", "unsupported");
      },
      async verify(): Promise<any> {
        return fail("Multi-factor auth is not available in the demo.", "unsupported");
      },
      async listFactors(): Promise<any> {
        return ok({ all: [], totp: [] });
      },
      async getAuthenticatorAssuranceLevel(): Promise<any> {
        return ok({ currentLevel: "aal1", nextLevel: "aal1", currentAuthenticationMethods: [] });
      },
    },

    admin: options.admin ?? {
      async deleteUser(): Promise<any> {
        return fail("auth.admin is not available in the browser.", "unsupported");
      },
      async getUserById(): Promise<any> {
        return fail("auth.admin is not available in the browser.", "unsupported");
      },
      async listUsers(): Promise<any> {
        return fail("auth.admin is not available in the browser.", "unsupported");
      },
    },
  };
}

export type MockAuth = ReturnType<typeof createMockAuth>;

/** Cookie adapter for client components (`document.cookie`). */
export function browserCookieAdapter(): AuthCookieAdapter {
  return {
    get(name: string) {
      if (typeof document === "undefined") return undefined;
      return readRawCookie(name);
    },
    set(name: string, value: string, options?: Record<string, unknown>) {
      if (typeof document === "undefined") return;
      const maxAge = options?.maxAge as number | undefined;
      const expires = maxAge ? new Date(Date.now() + maxAge * 1000).toUTCString() : "";
      document.cookie = `${name}=${value}; path=${options?.path ?? "/"}; samesite=lax${expires ? `; expires=${expires}` : ""}`;
    },
    delete(name: string) {
      if (typeof document === "undefined") return;
      document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    },
  };
}

function readRawCookie(name: string): string | undefined {
  const cookie = typeof document === "undefined" ? "" : document.cookie;
  for (const part of cookie.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq !== -1 && trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1);
  }
  return undefined;
}

export type { MockError };
