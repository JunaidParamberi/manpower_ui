/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The browser-side mock client: auth only.
 *
 * Client components in this app only ever touch `auth` (sign in, sign out,
 * password/email updates, cookie consent) — every table read and write goes
 * through server components or server actions. Anything else hitting `from()`
 * or `storage` here is a bug, so it fails loudly instead of silently
 * rendering an empty screen.
 */
import { browserCookieAdapter, createMockAuth, type AuthCookieAdapter } from "@/lib/mock/auth";
import type { MockSupabaseClient } from "@/lib/mock/client-types";

const unsupported = (method: string): never => {
  throw new Error(
    `[manpower-mock] ${method} is not available in the browser. ` +
      "This build is frontend-only: data access happens in server components and server actions.",
  );
};

export function createMockBrowserClient(): MockSupabaseClient {
  const cookies: AuthCookieAdapter = browserCookieAdapter();

  const auth = createMockAuth({
    cookies,
    admin: {
      async deleteUser() {
        return unsupported("auth.admin.deleteUser");
      },
      async getUserById() {
        return unsupported("auth.admin.getUserById");
      },
      async listUsers() {
        return unsupported("auth.admin.listUsers");
      },
    },
  });

  return {
    auth,
    from: () => unsupported("supabase.from"),
    rpc: () => unsupported("supabase.rpc"),
    storage: {
      from: () => unsupported("supabase.storage.from"),
    } as MockSupabaseClient["storage"],
  };
}
