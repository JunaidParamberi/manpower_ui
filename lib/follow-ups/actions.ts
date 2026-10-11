"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { getServerContext } from "@/lib/supabase/get-server-context";

const followUpIdSchema = z.string().uuid();

export type FollowUpActionResult = { ok: boolean; error?: string };

/**
 * Both transitions are scoped to `status = 'pending'` as well as the user, so
 * a double click cannot un-dismiss a row or mark an already-sent nudge sent a
 * second time.
 */
async function transition(
  id: string,
  patch: Record<string, string>,
): Promise<FollowUpActionResult> {
  const parsed = followUpIdSchema.safeParse(id);
  if (!parsed.success) {
    return { ok: false, error: "Invalid follow-up id." };
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const { error } = await supabase
    .from("follow_ups")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateTag("follow-ups");
  revalidateTag("dashboard");
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function dismissFollowUp(id: string): Promise<FollowUpActionResult> {
  return transition(id, {
    status: "dismissed",
    dismissed_at: new Date().toISOString(),
  });
}

export async function markFollowUpSent(id: string): Promise<FollowUpActionResult> {
  return transition(id, {
    status: "sent",
    sent_at: new Date().toISOString(),
  });
}
