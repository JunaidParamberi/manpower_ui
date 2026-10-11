import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Row shape the settings UI renders. Dates pass through `unstable_cache` JSON
 * serialization, so they are strings, never `Date`.
 */
export type McpConnectionRow = {
  id: string;
  client_name: string;
  created_at: string;
  last_used_at: string | null;
};

const _cachedMcpConnections = unstable_cache(
  async (userId: string): Promise<McpConnectionRow[]> => {
    const { data } = await createAdminClient()
      .from("mcp_connections")
      .select("id, client_name, created_at, last_used_at")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });
    return (data ?? []) as McpConnectionRow[];
  },
  ["mcp-connections"],
  { tags: ["mcp-connections"], revalidate: 60 },
);

/**
 * The user's live Claude/MCP connections for the settings page. Admin client +
 * explicit `user_id` scope, per the service-role discipline in
 * `lib/supabase/admin.ts`.
 */
export async function getMcpConnectionsForUser(userId: string): Promise<McpConnectionRow[]> {
  return _cachedMcpConnections(userId);
}
