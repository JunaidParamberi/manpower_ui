import { unstable_cache } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProjectClientRow } from "@/types";

const _cachedListProjectClients = unstable_cache(
  async (userId: string): Promise<ProjectClientRow[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("project_clients")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });
    if (error || !data) return [];
    return data as ProjectClientRow[];
  },
  ["list-project-clients"],
  { revalidate: 60, tags: ["project_clients"] },
);

export async function listProjectClients(): Promise<ProjectClientRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListProjectClients(user.id);
}

export async function getProjectClientById(id: string): Promise<ProjectClientRow | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("project_clients")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProjectClientRow;
}
