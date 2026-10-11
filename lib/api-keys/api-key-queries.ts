import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiKeyTypeValue } from "./api-key-validations";

/**
 * Row shape the settings UI renders. `last_used_at`/`expires_at` pass through
 * `unstable_cache` JSON serialization, so they are `string | null`, never
 * `Date`.
 */
export type ApiKeyRow = {
  id: string;
  name: string;
  type: ApiKeyTypeValue;
  description: string;
  key_prefix: string;
  scopes: string[];
  tools: Record<string, boolean>;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

const _cachedApiKeys = unstable_cache(
  async (userId: string): Promise<ApiKeyRow[]> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("api_keys")
      .select(
        "id, name, type, description, key_prefix, scopes, tools, last_used_at, expires_at, revoked_at, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data ?? []) as ApiKeyRow[];
  },
  ["api-keys"],
  { tags: ["api-keys"], revalidate: 30 },
);

/**
 * The user's API keys for the settings page. Admin client + explicit
 * `user_id` scope, per the service-role discipline in `lib/supabase/admin.ts`.
 */
export async function getApiKeysForUser(userId: string): Promise<ApiKeyRow[]> {
  return _cachedApiKeys(userId);
}