"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { projectClientInputSchema } from "@/lib/validations/project-client";
import type { ProjectClientRow } from "@/types";

type ProjectClientResult =
  | { ok: true; projectClient: ProjectClientRow }
  | { ok: false; error: string };

type OkResult = { ok: true } | { ok: false; error: string };

const uuidSchema = z.string().uuid();

function revalidate() {
  revalidateTag("project_clients");
  revalidatePath("/project-clients");
}

function friendlyError(error: { code?: string; message: string }): string {
  if (error.code === "23505" || error.message.includes("duplicate key")) {
    return "A client with this ID already exists.";
  }
  return error.message;
}

export async function createProjectClient(raw: unknown): Promise<ProjectClientResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = projectClientInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { data, error } = await supabase
    .from("project_clients")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      client_code: parsed.data.client_code || null,
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
  return { ok: true, projectClient: data as ProjectClientRow };
}

export async function updateProjectClient(raw: unknown): Promise<ProjectClientResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = projectClientInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (!parsed.data.id) return { ok: false, error: "Project client id required for update" };

  const { data, error } = await supabase
    .from("project_clients")
    .update({
      name: parsed.data.name,
      client_code: parsed.data.client_code || null,
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
  return { ok: true, projectClient: data as ProjectClientRow };
}

export async function deleteProjectClient(id: string): Promise<OkResult> {
  const parsed = uuidSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  await supabase
    .from("worker_clients")
    .delete()
    .eq("project_client_id", parsed.data)
    .eq("user_id", user.id);

  const { error } = await supabase
    .from("project_clients")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
