"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";

const revokeSchema = z.object({ id: z.uuid() });

export type RevokeMcpConnectionResult = { ok: true } | { ok: false; error: string };

/**
 * Disconnect from Settings. Users have no UPDATE grant on mcp_connections (so
 * they can't un-revoke or plant tokens via PostgREST); the service role does
 * the write, scoped by the signed-in user's id.
 */
export async function revokeMcpConnection(id: string): Promise<RevokeMcpConnectionResult> {
  const { user } = await getServerContext();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = revokeSchema.safeParse({ id });
  if (!parsed.success) return { ok: false, error: "Invalid connection." };

  const { data, error } = await createAdminClient()
    .from("mcp_connections")
    .update({ revoked_at: new Date().toISOString(), refresh_token_hash: null })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "That connection could not be disconnected." };

  revalidateTag("mcp-connections");
  return { ok: true };
}
