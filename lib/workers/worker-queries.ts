import { unstable_cache } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupplierRow, WorkerListRow, WorkerRow } from "@/types";

async function attachRelations(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  rows: WorkerRow[],
): Promise<WorkerListRow[]> {
  if (rows.length === 0) return [];

  const supplierIds = [...new Set(rows.map((r) => r.supplier_id).filter((v): v is string => Boolean(v)))];
  const suppliersById = new Map<string, SupplierRow>();
  if (supplierIds.length > 0) {
    const { data } = await supabase.from("suppliers").select("*").eq("user_id", userId);
    for (const s of (data ?? []) as SupplierRow[]) {
      if (supplierIds.includes(s.id)) suppliersById.set(s.id, s);
    }
  }

  const { data: links } = await supabase
    .from("worker_clients")
    .select("*")
    .eq("user_id", userId);
  const { data: projectClients } = await supabase
    .from("project_clients")
    .select("*")
    .eq("user_id", userId);
  const clientsById = new Map((projectClients ?? []).map((c: { id: string; name: string }) => [c.id, c]));

  const clientsByWorker = new Map<string, { id: string; name: string }[]>();
  for (const link of (links ?? []) as { worker_id: string; project_client_id: string }[]) {
    const client = clientsById.get(link.project_client_id);
    if (!client) continue;
    const list = clientsByWorker.get(link.worker_id) ?? [];
    list.push({ id: client.id, name: client.name });
    clientsByWorker.set(link.worker_id, list);
  }

  return rows.map((row) => ({
    ...row,
    supplier: row.supplier_id
      ? (() => {
          const s = suppliersById.get(row.supplier_id!);
          return s ? { id: s.id, name: s.name } : null;
        })()
      : null,
    clients: clientsByWorker.get(row.id) ?? [],
  }));
}

const _cachedListWorkers = unstable_cache(
  async (userId: string): Promise<WorkerListRow[]> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("workers")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });
    if (error || !data) return [];
    return attachRelations(supabase, userId, data as WorkerRow[]);
  },
  ["list-workers"],
  { revalidate: 60, tags: ["workers"] },
);

export async function listWorkers(): Promise<WorkerListRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedListWorkers(user.id);
}

export async function getWorkerById(id: string): Promise<WorkerListRow | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("workers")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  const [withRelations] = await attachRelations(supabase, user.id, [data as WorkerRow]);
  return withRelations;
}
