"use server";

import { getServerContext } from "@/lib/supabase/get-server-context";
import { globalSearchSchema } from "@/lib/validations/global-search";

import { searchGlobalEntitiesForUser } from "./search-queries";
import type { GlobalSearchResults } from "./types";

export type GlobalSearchActionResult =
  | { ok: true; results: GlobalSearchResults }
  | { ok: false; error: string };

export async function searchGlobalEntities(
  raw: unknown,
): Promise<GlobalSearchActionResult> {
  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, error: "Unauthenticated" };
  }

  const parsed = globalSearchSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid search query.",
    };
  }

  const results = await searchGlobalEntitiesForUser(user.id, parsed.data.query);
  return { ok: true, results };
}
