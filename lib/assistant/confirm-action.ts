"use server";

import { getServerContext } from "@/lib/supabase/get-server-context";

/**
 * Resolve a paused assistant action. The browser sends only the thread id,
 * the tool-use id, and a boolean — the action itself is read from the server
 * row, so an approval can never be redirected to a different action.
 *
 * Frontend-only build: no assistant backend is called. The confirm is
 * acknowledged locally so the UI flow can be exercised end to end.
 */
export type ConfirmActionResult =
  | { ok: true; summary: string; entity: string | null; entityId: string | null }
  | { ok: false; message: string };

export async function confirmAssistantAction(
  threadId: string,
  toolUseId: string,
  approved: boolean,
): Promise<ConfirmActionResult> {
  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  console.log("[mock-assistant] confirmAssistantAction", {
    threadId,
    toolUseId,
    approved,
  });

  return {
    ok: true,
    summary: approved ? "Action confirmed." : "Action cancelled.",
    entity: null,
    entityId: null,
  };
}
