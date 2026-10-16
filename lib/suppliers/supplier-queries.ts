import { unstable_cache } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupplierRow } from "@/types";

const _cachedListSuppliers = unstable_cache(
  async (userId: string): Promise<SupplierRow[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });
    if (error || !data) return [];
    return data as SupplierRow[];
  },
  ["list-suppliers"],
  { revalidate: 60, tags: ["suppliers"] },
);

export async function listSuppliers(): Promise<SupplierRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListSuppliers(user.id);
}

export async function getSupplierById(id: string): Promise<SupplierRow | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return data as SupplierRow;
}
