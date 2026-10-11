"use server";

import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { normalizeThreadMode } from "./thread-mode";
import { parseTurnMeta, type ParsedTurnMeta } from "./turn-meta";

export type ThreadSummary = {
  threadId: string;
  title: string;
  mode: "ask" | "agent";
};

export type ThreadMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  actions: ParsedTurnMeta["actions"];
  steps: ParsedTurnMeta["steps"];
  draft: ParsedTurnMeta["draft"];
  emailDraft: ParsedTurnMeta["emailDraft"];
};

export type ThreadListItem = {
  threadId: string;
  title: string;
  mode: "ask" | "agent";
  updatedAt: Date;
};

/**
 * Raw shape cached by _cachedGetActiveThread. unstable_cache serializes via
 * JSON, but this has no Date fields so no coercion is needed downstream.
 */
type CachedThreadSummary = {
  threadId: string;
  title: string;
  mode: "ask" | "agent";
} | null;

/**
 * Worker for getActiveThread. Receives only the userId string so
 * unstable_cache can serialize args across the cache boundary.
 */
const _cachedGetActiveThread = unstable_cache(
  async (userId: string): Promise<CachedThreadSummary> => {
    const supabase = createAdminClient();

    const { data: profile } = await supabase
      .from("profiles")
      .select("active_thread_id")
      .eq("id", userId)
      .maybeSingle();

    const threadId = (profile as { active_thread_id: string | null } | null)
      ?.active_thread_id;
    if (!threadId) {
      return null;
    }

    const { data: thread } = await supabase
      .from("ai_threads")
      .select("id, title, mode")
      .eq("id", threadId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!thread) {
      return null;
    }

    const row = thread as { id: string; title: string | null; mode: string | null };
    return {
      threadId: row.id,
      title: row.title ?? "",
      mode: normalizeThreadMode(row.mode),
    };
  },
  ["ai-active-thread"],
  { revalidate: 30, tags: ["ai-thread"] }
);

export async function getActiveThread(): Promise<ThreadSummary | null> {
  const { user } = await getServerContext();
  if (!user) {
    return null;
  }
  return _cachedGetActiveThread(user.id);
}

const THREAD_LIST_LIMIT = 30;

/**
 * Raw shape cached by _cachedListThreads. updated_at survives unstable_cache's
 * JSON serialization as an ISO string, not a Date — coerce at the consumer.
 */
type CachedThreadListItem = {
  threadId: string;
  title: string;
  mode: "ask" | "agent";
  updatedAt: Date | string;
};

/**
 * Worker for listThreads. Only the userId string (required by unstable_cache
 * serialization rules).
 */
const _cachedListThreads = unstable_cache(
  async (userId: string): Promise<CachedThreadListItem[]> => {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from("ai_threads")
      .select("id, title, mode, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(THREAD_LIST_LIMIT);

    return (
      (data ?? []) as Array<{ id: string; title: string | null; mode: string | null; updated_at: string }>
    ).map((row) => ({
      threadId: row.id,
      title: row.title ?? "Untitled",
      mode: normalizeThreadMode(row.mode),
      updatedAt: row.updated_at,
    }));
  },
  ["ai-thread-list"],
  { revalidate: 30, tags: ["ai-thread"] }
);

/**
 * All of the user's threads (active and archived), most recently touched
 * first — the data source for the panel's "past sessions" history dropdown.
 */
export async function listThreads(): Promise<ThreadListItem[]> {
  const { user } = await getServerContext();
  if (!user) {
    return [];
  }
  const rows = await _cachedListThreads(user.id);
  return rows.map((row) => ({
    threadId: row.threadId,
    title: row.title,
    mode: row.mode,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt),
  }));
}

/**
 * Mode of the user's most recently touched thread, archived or not. A brand
 * new session opens in whatever mode they last worked in rather than always
 * resetting to Ask.
 */
const _cachedGetLastUsedMode = unstable_cache(
  async (userId: string): Promise<"ask" | "agent"> => {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("ai_threads")
      .select("mode")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return normalizeThreadMode((data as { mode: string | null } | null)?.mode ?? null);
  },
  ["ai-last-used-mode"],
  { revalidate: 60, tags: ["ai-thread"] },
);

export async function getLastUsedMode(): Promise<"ask" | "agent"> {
  const { user } = await getServerContext();
  if (!user) {
    return "ask";
  }
  return _cachedGetLastUsedMode(user.id);
}

/**
 * Raw shape cached by _cachedListMessages. created_at survives unstable_cache's
 * JSON serialization as an ISO string, not a Date — coerce at the consumer.
 */
type CachedThreadMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: Date | string;
  actions: ParsedTurnMeta["actions"];
  steps: ParsedTurnMeta["steps"];
  draft: ParsedTurnMeta["draft"];
  emailDraft: ParsedTurnMeta["emailDraft"];
};

/**
 * Worker for listMessages. Only string args (required by unstable_cache
 * serialization rules).
 *
 * Ordered by `seq`, never `created_at`: a turn's user and assistant rows are
 * written in one batched insert and share a created_at to the microsecond, so
 * created_at leaves their relative order undefined and `pairMessagesIntoTurns`
 * silently drops the reply when the assistant row sorts first.
 */
const _cachedListMessages = unstable_cache(
  async (threadId: string, userId: string): Promise<CachedThreadMessage[]> => {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from("ai_messages")
      .select("role, content, created_at, seq, tool_calls")
      .eq("thread_id", threadId)
      .eq("user_id", userId)
      .order("seq", { ascending: true });

    return (
      (data ?? []) as Array<{
        role: "user" | "assistant";
        content: string;
        created_at: string;
        tool_calls: unknown;
      }>
    ).map((row) => {
      const meta = parseTurnMeta(Array.isArray(row.tool_calls) ? row.tool_calls[0] : null);
      return {
        role: row.role,
        content: row.content,
        createdAt: row.created_at,
        actions: meta.actions,
        steps: meta.steps,
        draft: meta.draft,
        emailDraft: meta.emailDraft,
      };
    });
  },
  ["ai-thread-messages"],
  { revalidate: 30, tags: ["ai-thread"] }
);

export async function listMessages(threadId: string): Promise<ThreadMessage[]> {
  const { user } = await getServerContext();
  if (!user) {
    return [];
  }
  const rows = await _cachedListMessages(threadId, user.id);
  return rows.map((row) => ({
    role: row.role,
    content: row.content,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
    actions: row.actions,
    steps: row.steps,
    draft: row.draft,
    emailDraft: row.emailDraft,
  }));
}
