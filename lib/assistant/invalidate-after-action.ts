"use server";

import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Mirrors `PROFITABILITY_CACHE_TAG` in lib/projects/profitability-queries.ts.
 * Duplicated as a literal rather than imported so this server-action module
 * doesn't pull the admin Supabase client into its import graph.
 */
const PROFITABILITY_TAG = "project-profitability";

/**
 * Per-entity cache tags. Each list must match the tags the entity's own query
 * modules pass to `unstable_cache` — see the tag table in docs/DATABASE.md.
 */
const ENTITY_TAGS: Record<string, readonly string[]> = {
  clients: ["clients"],
  projects: ["projects"],
  tasks: ["projects", "tasks"],
  documents: ["documents", "finance", PROFITABILITY_TAG],
  payments: ["documents", "projects", "finance", PROFITABILITY_TAG],
  services: ["services"],
  expenses: ["expenses", "finance", PROFITABILITY_TAG],
  content_posts: ["content-posts"],
  content_campaigns: ["content-campaigns"],
  project_milestones: ["projects"],
  time_entries: ["projects", "time", PROFITABILITY_TAG],
};

/**
 * Tags busted after every AI turn, write or not. `ai-thread` is here because
 * `listMessages` (lib/assistant/thread-queries.ts) caches thread history for
 * 30s — without this, a reload mid-conversation shows a truncated thread.
 */
const ALWAYS = ["dashboard", "notifications", "ai-thread"] as const;

export type InvalidateAfterActionInput = {
  actions: Array<{ entity: string; entityId: string | null }>;
};

/**
 * Server action — runs `revalidateTag` per entity affected by an AI write.
 * The Edge Function can't import `next/cache`; this bridge does it from the
 * Next.js runtime via the SSE consumer's POST.
 */
export async function invalidateAfterAiAction(
  input: InvalidateAfterActionInput,
): Promise<{ tags: string[] }> {
  const seen = new Set<string>(ALWAYS);
  for (const action of input.actions) {
    const tags = ENTITY_TAGS[action.entity] ?? [];
    for (const tag of tags) {
      seen.add(tag);
    }
  }
  const tags = Array.from(seen);
  for (const tag of tags) {
    revalidateTag(tag);
  }
  revalidatePath("/");
  return { tags };
}
