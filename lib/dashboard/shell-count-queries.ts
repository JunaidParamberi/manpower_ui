import { unstable_cache } from "next/cache";

import { startOfCurrentMonth } from "@/lib/plan-usage/helpers";
import { getServerContext } from "@/lib/supabase/get-server-context";

type CountQueryResult = {
  count: number | null;
  error: { message: string } | null;
};

type ClientCountSupabase = {
  from(table: "clients"): {
    select(
      columns: "id",
      options: { count: "exact"; head: true },
    ): {
      eq(column: "user_id", value: string): PromiseLike<CountQueryResult>;
    };
  };
};

type DocCountSupabase = {
  from(table: "documents"): {
    select(
      columns: "id",
      options: { count: "exact"; head: true },
    ): {
      eq(
        column: "user_id",
        value: string,
      ): {
        gte(
          column: "created_at",
          value: string,
        ): PromiseLike<CountQueryResult>;
      };
    };
  };
};

export function buildClientCountQuery(
  supabase: ClientCountSupabase,
  userId: string,
) {
  return supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
}

export function buildDocCountThisMonthQuery(
  supabase: DocCountSupabase,
  userId: string,
  monthStartIso: string,
) {
  return supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStartIso);
}

const _cachedGetClientCountForUser = unstable_cache(
  async (userId: string): Promise<number> => {
    const { supabase } = await getServerContext();
    const { count, error } = await buildClientCountQuery(
      supabase as unknown as ClientCountSupabase,
      userId,
    );
    if (error) return 0;
    return count ?? 0;
  },
  ["shell-client-count"],
  { revalidate: 60, tags: ["clients", "dashboard"] },
);

export async function getClientCountForUser(): Promise<number> {
  const { user } = await getServerContext();
  if (!user) return 0;
  return _cachedGetClientCountForUser(user.id);
}

const _cachedGetDocCountThisMonth = unstable_cache(
  async (userId: string, monthStartIso: string): Promise<number> => {
    const { supabase } = await getServerContext();
    const { count, error } = await buildDocCountThisMonthQuery(
      supabase as unknown as DocCountSupabase,
      userId,
      monthStartIso,
    );
    if (error) return 0;
    return count ?? 0;
  },
  ["shell-doc-count-month"],
  { revalidate: 60, tags: ["documents", "dashboard"] },
);

export async function getDocCountThisMonthForUser(): Promise<number> {
  const { user } = await getServerContext();
  if (!user) return 0;
  return _cachedGetDocCountThisMonth(user.id, startOfCurrentMonth());
}
