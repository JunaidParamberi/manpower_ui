import { anonymousJar, createMockServerClient } from "@/lib/mock/server-client";
import { provisionFromCookiesInBackground } from "@/lib/mock/store";

/**
 * Mock replacement for the service-role client.
 *
 * The original existed so `unstable_cache` workers (which have no request
 * context, and therefore no `cookies()`) could still query. The mock store is
 * a plain JSON file, so there is no key to guard — every client sees the same
 * data, and callers must still filter by `user_id`, exactly as before.
 *
 * Sync, like the original: `const supabase = createAdminClient()`.
 */
export function createAdminClient() {
  provisionFromCookiesInBackground();
  return createMockServerClient(anonymousJar);
}
