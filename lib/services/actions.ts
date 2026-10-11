"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { serviceInputSchema } from "@/lib/validations/service";
import { z } from "zod";
import type { ServiceRow } from "@/types";

type ServiceResult =
  | { ok: true; service: ServiceRow }
  | { ok: false; error: string };

type OkResult = { ok: true } | { ok: false; error: string };

const uuidSchema = z.string().uuid();

function revalidate() {
  revalidateTag("services");
  revalidatePath("/services");
}

export async function createService(raw: unknown): Promise<ServiceResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = serviceInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { data, error } = await supabase
    .from("services")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      service_type: parsed.data.service_type,
      unit: parsed.data.unit,
      sku: parsed.data.sku ?? null,
      default_qty: parsed.data.default_qty,
      cost_price: parsed.data.cost_price ?? null,
      default_rate: parsed.data.default_rate,
      default_tax_mode: parsed.data.default_tax_mode,
      default_tax_rate: parsed.data.default_tax_rate,
      hsn_sac_code: parsed.data.hsn_sac_code ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true, service: data as ServiceRow };
}

export async function updateService(raw: unknown): Promise<ServiceResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = serviceInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (!parsed.data.id) return { ok: false, error: "Service id required for update" };

  const { data, error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      service_type: parsed.data.service_type,
      unit: parsed.data.unit,
      sku: parsed.data.sku ?? null,
      default_qty: parsed.data.default_qty,
      cost_price: parsed.data.cost_price ?? null,
      default_rate: parsed.data.default_rate,
      default_tax_mode: parsed.data.default_tax_mode,
      default_tax_rate: parsed.data.default_tax_rate,
      hsn_sac_code: parsed.data.hsn_sac_code ?? null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true, service: data as ServiceRow };
}

export async function archiveService(id: string): Promise<OkResult> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { error } = await supabase
    .from("services")
    .update({ archived: true })
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteService(id: string): Promise<OkResult> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
