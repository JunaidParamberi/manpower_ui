import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";

const OPEN_TASK_STATUSES = ["todo", "in_progress"] as const;

type CountQueryResult = {
  count: number | null;
  error: { message: string } | null;
};

type OpenTaskCountFilterChain = {
  in(column: "status", values: readonly string[]): PromiseLike<CountQueryResult>;
};

type OpenTaskCountSelectChain = {
  eq(column: "projects.user_id", value: string): OpenTaskCountFilterChain;
};

type OpenTaskCountSupabase = {
  from(table: "tasks"): {
    select(
      columns: "id, projects!inner(user_id)",
      options: { count: "exact"; head: true },
    ): OpenTaskCountSelectChain;
  };
};

export function buildOpenTaskCountQuery(
  supabase: OpenTaskCountSupabase,
  userId: string,
) {
  return supabase
    .from("tasks")
    .select("id, projects!inner(user_id)", { count: "exact", head: true })
    .eq("projects.user_id", userId)
    .in("status", OPEN_TASK_STATUSES);
}

const _cachedGetOpenTaskCountForUser = unstable_cache(
  async (userId: string): Promise<number> => {
    const supabase = createAdminClient();
    const { count, error } = await buildOpenTaskCountQuery(
      supabase as unknown as OpenTaskCountSupabase,
      userId,
    );

    if (error) {
      return 0;
    }

    return count ?? 0;
  },
  ["tasks-open-count"],
  { revalidate: 60, tags: ["tasks"] },
);

export async function getOpenTaskCountForUser(): Promise<number> {
  const { user } = await getServerContext();
  if (!user) {
    return 0;
  }
  return _cachedGetOpenTaskCountForUser(user.id);
}
