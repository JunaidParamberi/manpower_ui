// deno-lint-ignore no-explicit-any -- matches Supabase client shape; explicit `.ts` imports keep Deno happy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export type PendingTool = {
  toolUseId: string;
  name: string;
  input: unknown;
};

export type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
  tool_calls: unknown[] | null;
};

/**
 * Persist the paused loop. `messages` is the full Anthropic messages array,
 * so resuming needs no client-supplied context — the browser only sends an
 * id and a boolean, and can never substitute a different action.
 *
 * Used by the assistant Edge Function for confirm-buffer persistence.
 */
export async function saveThread(
  supabase: SupabaseClient,
  params: {
    threadId: string | null;
    userId: string;
    messages: unknown;
    pendingTool: PendingTool | null;
    mode: "ask" | "agent";
  },
): Promise<string | null> {
  const row = {
    user_id: params.userId,
    messages: params.messages,
    pending_tool: params.pendingTool,
    mode: params.mode,
    status: params.pendingTool ? "awaiting_confirm" : "idle",
    updated_at: new Date().toISOString(),
  };

  if (params.threadId) {
    const { error } = await supabase
      .from("ai_threads")
      .update(row)
      .eq("id", params.threadId)
      .eq("user_id", params.userId);
    return error ? null : params.threadId;
  }

  const { data, error } = await supabase
    .from("ai_threads")
    .insert(row)
    .select("id")
    .single();
  return error ? null : (data as { id: string }).id;
}

export async function loadThread(
  supabase: SupabaseClient,
  threadId: string,
  userId: string,
): Promise<
  | { ok: true; messages: unknown[]; pendingTool: PendingTool | null; mode: "ask" | "agent" }
  | { ok: false }
> {
  const { data, error } = await supabase
    .from("ai_threads")
    .select("messages, pending_tool, mode")
    .eq("id", threadId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false };
  }

  const row = data as {
    messages: unknown[];
    pending_tool: PendingTool | null;
    mode: "ask" | "agent";
  };

  return {
    ok: true,
    messages: Array.isArray(row.messages) ? row.messages : [],
    pendingTool: row.pending_tool,
    mode: row.mode,
  };
}

/**
 * Create a new thread row. `title` is generated from the first prompt
 * (first 60 chars) and can be edited later.
 */
export async function createThread(
  supabase: SupabaseClient,
  params: { userId: string; mode: "ask" | "agent"; title?: string | null },
): Promise<string | null> {
  const row = {
    user_id: params.userId,
    messages: [] as unknown[],
    pending_tool: null,
    mode: params.mode,
    status: "idle" as const,
    title: params.title ?? null,
    is_archived: false,
  };
  const { data, error } = await supabase
    .from("ai_threads")
    .insert(row)
    .select("id")
    .single();
  return error ? null : (data as { id: string }).id;
}

/**
 * Read prior conversation history from `ai_messages`, ordered oldest → newest.
 * Returns the Claude-API shape directly so the call site can prepend the new
 * user prompt without further mapping.
 *
 * Ordered by `seq`, never `created_at`: a turn's user and assistant rows are
 * written in one batched insert and share a created_at to the microsecond, so
 * created_at leaves their relative order undefined. A history that starts with
 * an assistant message is rejected by the Anthropic API and wedges the thread.
 */
export async function loadHistoryMessages(
  supabase: SupabaseClient,
  params: { threadId: string; userId: string },
): Promise<HistoryMessage[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("role, content, tool_calls, seq")
    .eq("thread_id", params.threadId)
    .eq("user_id", params.userId)
    .order("seq", { ascending: true });

  if (error || !data) {
    return [];
  }
  return (data as Array<{ role: "user" | "assistant"; content: string; tool_calls: unknown[] | null }>).map((row) => ({
    role: row.role,
    content: row.content,
    tool_calls: row.tool_calls,
  }));
}

/**
 * Append one or more message rows to a thread in a single batched insert.
 * If any row fails, `error` is set and the whole call returns false — there
 * is no partial success.
 */
export async function appendMessages(
  supabase: SupabaseClient,
  params: {
    threadId: string;
    userId: string;
    messages: Array<{ role: "user" | "assistant"; content: string; tool_calls?: unknown[] | null }>;
  },
): Promise<boolean> {
  if (params.messages.length === 0) {
    return true;
  }
  const rows = params.messages.map((message) => ({
    thread_id: params.threadId,
    user_id: params.userId,
    role: message.role,
    content: message.content,
    tool_calls: message.tool_calls ?? null,
  }));
  const { error } = await supabase.from("ai_messages").insert(rows);
  return !error;
}
