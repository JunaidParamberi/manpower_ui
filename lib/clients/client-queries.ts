import { unstable_cache } from "next/cache";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type { ClientRow } from "@/types";

import { normalizeClientRow } from "@/lib/clients/normalize-client-row";

const uuidSchema = z.string().uuid();

export type ListClientsResult =
  | { ok: true; clients: ClientRow[] }
  | { ok: false; message: string };

const _cachedGetClientById = unstable_cache(
  async (userId: string, id: string): Promise<ClientRow | null> => {
    const parsedId = uuidSchema.safeParse(id);
    if (!parsedId.success) return null;

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", parsedId.data)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return normalizeClientRow(data);
  },
  ["client-by-id"],
  { revalidate: 60, tags: ["clients"] }
);

export async function getClientById(id: string): Promise<ClientRow | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  return _cachedGetClientById(user.id, id);
}

const _cachedListClients = unstable_cache(
  async (userId: string): Promise<ListClientsResult> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      clients: (data ?? []).map((row) => normalizeClientRow(row)),
    };
  },
  ["clients-list"],
  { revalidate: 60, tags: ["clients"] }
);

export async function listClients(): Promise<ListClientsResult> {
  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }
  return _cachedListClients(user.id);
}
