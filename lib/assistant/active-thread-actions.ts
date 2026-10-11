"use server";

import { revalidateTag } from "next/cache";

import { getServerContext } from "@/lib/supabase/get-server-context";

const TAG = "ai-thread";

function inputsOk(parsed: { ok: true; threadId: string } | { ok: false; message: string }): parsed is { ok: true; threadId: string } {
  return parsed.ok;
}

function parseThreadId(input: unknown): { ok: true; threadId: string } | { ok: false; message: string } {
  if (typeof input !== "string" || input.length === 0) {
    return { ok: false, message: "threadId is required" };
  }
  return { ok: true, threadId: input };
}

export async function setActiveThread(input: unknown): Promise<void> {
  const parsed = parseThreadId(input);
  if (!inputsOk(parsed)) {
    return;
  }
  const { supabase, user } = await getServerContext();
  if (!user) {
    return;
  }
  await supabase
    .from("profiles")
    .update({ active_thread_id: parsed.threadId })
    .eq("id", user.id);
  revalidateTag(TAG);
}

export async function archiveThread(input: unknown): Promise<void> {
  const parsed = parseThreadId(input);
  if (!inputsOk(parsed)) {
    return;
  }
  const { supabase, user } = await getServerContext();
  if (!user) {
    return;
  }
  await supabase
    .from("ai_threads")
    .update({ is_archived: true })
    .eq("id", parsed.threadId)
    .eq("user_id", user.id);
  revalidateTag(TAG);
}

export async function setThreadMode(input: unknown, mode: unknown): Promise<void> {
  const parsed = parseThreadId(input);
  if (!inputsOk(parsed)) {
    return;
  }
  if (mode !== "ask" && mode !== "agent") {
    return;
  }
  const { supabase, user } = await getServerContext();
  if (!user) {
    return;
  }
  await supabase
    .from("ai_threads")
    .update({ mode })
    .eq("id", parsed.threadId)
    .eq("user_id", user.id);
  revalidateTag(TAG);
}

export async function clearActiveThread(): Promise<void> {
  const { supabase, user } = await getServerContext();
  if (!user) {
    return;
  }
  await supabase
    .from("profiles")
    .update({ active_thread_id: null })
    .eq("id", user.id);
  revalidateTag(TAG);
}
