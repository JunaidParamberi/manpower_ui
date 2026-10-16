"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { supplierInputSchema } from "@/lib/validations/supplier";
import type { SupplierRow } from "@/types";

type SupplierResult =
  | { ok: true; supplier: SupplierRow }
  | { ok: false; error: string };

type OkResult = { ok: true } | { ok: false; error: string };

const uuidSchema = z.string().uuid();

function revalidate() {
  revalidateTag("suppliers");
  revalidatePath("/suppliers");
}

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23505" || error.message.includes("duplicate key")) {
    return "A supplier with this ID already exists.";
  }
  return error.message;
}

export async function createSupplier(raw: unknown): Promise<SupplierResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = supplierInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      supplier_code: parsed.data.supplier_code || null,
      license_number: parsed.data.license_number || null,
      vat_number: parsed.data.vat_number || null,
      contact_name: parsed.data.contact_name || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      website: parsed.data.website || null,
      notes: parsed.data.notes || null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: friendlyError(error) };
  revalidate();
  return { ok: true, supplier: data as SupplierRow };
}

export async function updateSupplier(raw: unknown): Promise<SupplierResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = supplierInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (!parsed.data.id) return { ok: false, error: "Supplier id required for update" };

  const { data, error } = await supabase
    .from("suppliers")
    .update({
      name: parsed.data.name,
      supplier_code: parsed.data.supplier_code || null,
      license_number: parsed.data.license_number || null,
      vat_number: parsed.data.vat_number || null,
      contact_name: parsed.data.contact_name || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      website: parsed.data.website || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { ok: false, error: friendlyError(error) };
  revalidate();
  return { ok: true, supplier: data as SupplierRow };
}

export async function deleteSupplier(id: string): Promise<OkResult> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const unlink = await supabase
    .from("workers")
    .update({ supplier_id: null })
    .eq("supplier_id", parsed.data)
    .eq("user_id", user.id);
  if (unlink.error) return { ok: false, error: unlink.error.message };

  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  revalidateTag("workers");
  revalidatePath("/workers");
  return { ok: true };
}
