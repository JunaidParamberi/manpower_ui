"use server";

import { unstable_cache } from "next/cache";

import { getServerContext } from "@/lib/supabase/get-server-context";
import type { DigestFacts } from "@/lib/projects/digest-facts";
import type { DigestAction } from "@/lib/projects/digest-response";

export type LatestDigest = {
  id: string;
  digestDate: string;
  facts: DigestFacts;
  narrative: string | null;
  actions: DigestAction[];
  /** Date through unstable_cache arrives as an ISO string. */
  createdAt: Date | string;
};

const _cachedGetLatestDigest = unstable_cache(
  async (userId: string): Promise<LatestDigest | null> => {
    const { supabase } = await getServerContext();

    const { data } = await supabase
      .from("project_digests")
      .select("id, digest_date, facts, narrative, actions, created_at")
      .eq("user_id", userId)
      .order("digest_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      digestDate: data.digest_date,
      facts: data.facts as DigestFacts,
      narrative: data.narrative,
      actions: (data.actions ?? []) as DigestAction[],
      createdAt: data.created_at,
    };
  },
  ["latest-project-digest"],
  { revalidate: 60, tags: ["project-digests"] },
);

export async function getLatestDigest(): Promise<LatestDigest | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  return _cachedGetLatestDigest(user.id);
}
