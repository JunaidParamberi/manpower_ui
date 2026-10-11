import { createMockBrowserClient } from "@/lib/mock/browser-client";

/**
 * Mock replacement for the `@supabase/ssr` browser client.
 *
 * Auth only — reads/writes the `mock_session` cookie through `document.cookie`.
 * Table reads and writes happen on the server (server components and server
 * actions), so `from()` and `storage` deliberately throw if called here.
 *
 * Not marked "use client": server components legitimately import this module
 * too (e.g. the auth entry links) and only call `auth`.
 */
export function createClient() {
  return createMockBrowserClient();
}
