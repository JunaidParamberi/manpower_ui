import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "@/db/schema";

export type AuthDatabase = DrizzleD1Database<typeof schema>;

export async function getAuthDb(): Promise<AuthDatabase> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.DB) {
    throw new Error("D1 binding DB is not available.");
  }
  return drizzle(env.DB, { schema });
}
