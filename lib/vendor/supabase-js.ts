/**
 * Type shim for `@supabase/supabase-js`.
 *
 * The original app imported its *types* (and one runtime helper) from the real
 * package. This frontend-only build maps the package name to a local module
 * through `tsconfig.json`'s `paths`, so the ~20 modules that say
 *
 *     import type { SupabaseClient } from "@supabase/supabase-js";
 *
 * keep compiling, but resolve to the mock client's type. Nothing from the real
 * package is installed or bundled.
 */
import type { MockSupabaseClient } from "@/lib/mock/client-types";
import type { MockError, MockSession, MockUser } from "@/lib/mock/types";

export type SupabaseClient = MockSupabaseClient;
export type User = MockUser;
export type Session = MockSession;
export type PostgrestError = MockError;
export type AuthError = MockError & { status?: number };

export type EmailOtpType =
  | "signup"
  | "recovery"
  | "invite"
  | "magiclink"
  | "email_change"
  | "email";

/** Runtime safety net: this build has no Supabase project to talk to. */
export function createClient(_url?: string, _key?: string): SupabaseClient {
  throw new Error(
    "[manpower-mock] @supabase/supabase-js is not part of this frontend-only build. " +
      "Use `createClient` from `@/lib/supabase/server` (or `.../client`, `.../admin`) instead.",
  );
}
