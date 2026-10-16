"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { workerInputSchema, workerStatusSchema } from "@/lib/validations/worker";
import type { WorkerRow } from "@/types";

type WorkerResult =
  | { ok: true; worker: WorkerRow }
  | { ok: false; error: string };

type OkResult = { ok: true } | { ok: false; error: string };

const uuidSchema = z.string().uuid();

function revalidate() {
  revalidateTag("workers");
  revalidatePath("/workers");
}

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23505" || error.message.includes("duplicate key")) {
    return "An employee with this ID already exists.";
  }
  return error.message;
}

function baseFields(parsed: ReturnType<typeof workerInputSchema.parse>) {
  return {
    employee_id: parsed.employee_id,
    name: parsed.name,
    nationality: parsed.nationality || null,
    trade_category: parsed.trade_category || null,
    status: parsed.status,
    supplier_id: parsed.supplier_id ?? null,
    notes: parsed.notes || null,
    passport_number: parsed.passport_number || null,
    passport_expiry: parsed.passport_expiry || null,
    emirates_id: parsed.emirates_id || null,
    emirates_id_expiry: parsed.emirates_id_expiry || null,
    visa_number: parsed.visa_number || null,
    visa_expiry: parsed.visa_expiry || null,
    medical_fit: parsed.medical_fit,
    medical_expiry: parsed.medical_expiry || null,
    has_insurance: parsed.has_insurance,
    insurance_expiry: parsed.insurance_expiry || null,
  };
}

async function validateWorkerReferences(
  supabase: Awaited<ReturnType<typeof getServerContext>>["supabase"],
  userId: string,
  supplierId: string | null | undefined,
  clientIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (supplierId) {
    const { data, error } = await supabase
      .from("suppliers")
      .select("id")
      .eq("id", supplierId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return { ok: false, error: "Invalid supplier." };
  }

  if (clientIds.length > 0) {
    const uniqueClientIds = [...new Set(clientIds)];
    const { data, error } = await supabase
      .from("project_clients")
      .select("id")
      .in("id", uniqueClientIds)
      .eq("user_id", userId);
    if (error || !data || data.length !== uniqueClientIds.length) {
      return { ok: false, error: "Invalid client." };
    }
  }

  return { ok: true };
}

async function syncWorkerClients(
  supabase: Awaited<ReturnType<typeof getServerContext>>["supabase"],
  userId: string,
  workerId: string,
  clientIds: string[],
) {
  await supabase.from("worker_clients").delete().eq("worker_id", workerId).eq("user_id", userId);
  if (clientIds.length === 0) return;
  await supabase.from("worker_clients").insert(
    clientIds.map((projectClientId) => ({
      user_id: userId,
      worker_id: workerId,
      project_client_id: projectClientId,
    })),
  );
}

export async function createWorker(raw: unknown): Promise<WorkerResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = workerInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const referenceCheck = await validateWorkerReferences(supabase, user.id, parsed.data.supplier_id, parsed.data.client_ids);
  if (!referenceCheck.ok) return referenceCheck;

  const { data, error } = await supabase
    .from("workers")
    .insert({ user_id: user.id, ...baseFields(parsed.data) })
    .select()
    .single();

  if (error) return { ok: false, error: friendlyError(error) };

  await syncWorkerClients(supabase, user.id, (data as WorkerRow).id, parsed.data.client_ids);

  revalidate();
  return { ok: true, worker: data as WorkerRow };
}

export async function updateWorker(raw: unknown): Promise<WorkerResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = workerInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (!parsed.data.id) return { ok: false, error: "Worker id required for update" };

  const referenceCheck = await validateWorkerReferences(supabase, user.id, parsed.data.supplier_id, parsed.data.client_ids);
  if (!referenceCheck.ok) return referenceCheck;

  const { data, error } = await supabase
    .from("workers")
    .update(baseFields(parsed.data))
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { ok: false, error: friendlyError(error) };

  await syncWorkerClients(supabase, user.id, parsed.data.id, parsed.data.client_ids);

  revalidate();
  return { ok: true, worker: data as WorkerRow };
}

export async function updateWorkerStatus(id: string, status: string): Promise<WorkerResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const parsedStatus = workerStatusSchema.safeParse(status);
  if (!parsedStatus.success) return { ok: false, error: "Invalid status." };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data, error } = await supabase
    .from("workers")
    .update({ status: parsedStatus.data })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { ok: false, error: friendlyError(error) };
  revalidate();
  return { ok: true, worker: data as WorkerRow };
}

export async function deleteWorker(id: string): Promise<OkResult> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  await supabase.from("worker_clients").delete().eq("worker_id", parsed.data).eq("user_id", user.id);
  await supabase.from("worker_documents").delete().eq("worker_id", parsed.data).eq("user_id", user.id);

  const { error } = await supabase
    .from("workers")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
