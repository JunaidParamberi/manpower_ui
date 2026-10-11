import { cookies } from "next/headers";

import { createMockServerClient, type CookieJar } from "@/lib/mock/server-client";
import { currentServerSession } from "@/lib/mock/store";

/**
 * Mock replacement for the `@supabase/ssr` server client.
 *
 * Still async (callers do `await createClient()`), still backed by request
 * cookies — but the "database" is `mock-db.json`, and signing in with any
 * credentials provisions a full demo workspace on the spot.
 */
export async function createClient() {
  const cookieStore = await cookies();

  // Make sure the signed-in account (and its seeded workspace) exists before
  // any query in this request runs.
  await currentServerSession();

  const jar: CookieJar = {
    get: (name) => cookieStore.get(name),
    set: (name, value, options) => cookieStore.set(name, value as string, options),
    delete: (name) => cookieStore.delete(name),
  };

  return createMockServerClient(jar);
}
