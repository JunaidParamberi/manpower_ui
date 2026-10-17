import { cache } from "react";
import { headers } from "next/headers";

import { getAuthDb } from "@/db";
import { createAuth } from "@/lib/auth";

export type RequestAuthUser = {
  id: string;
  email: string;
  name: string;
};

/** Better Auth session for this request. Throws when D1 or the session lookup fails. */
export const getRequestAuthUser = cache(async (): Promise<RequestAuthUser | null> => {
  const auth = createAuth(await getAuthDb());
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user.email) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
});
