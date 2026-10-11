import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ServerContextUser = {
  id: string;
  email: string | null;
};

type ClaimsLike = {
  sub?: string;
  email?: string;
};

export function claimsToUser(
  claims: ClaimsLike | null | undefined,
): ServerContextUser | null {
  if (!claims?.sub) return null;
  return { id: claims.sub, email: claims.email ?? null };
}

/**
 * getClaims() verifies the JWT locally (no network round trip), unlike
 * getUser() which calls the Supabase Auth server on every render. The
 * middleware already gates every app route with getClaims(), so this is
 * the same trust level. Consumers only ever need user.id / user.email.
 */
export const getServerContext = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, user: claimsToUser(data?.claims) };
});
