import { unstable_cache } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceRow } from "@/types";

const _cachedListServices = unstable_cache(
  async (userId: string): Promise<ServiceRow[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("user_id", userId)
      .eq("archived", false)
      .order("name", { ascending: true });
    if (error || !data) return [];
    return data as ServiceRow[];
  },
  ["list-services"],
  { revalidate: 60, tags: ["services"] },
);

export async function listServices(): Promise<ServiceRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListServices(user.id);
}
