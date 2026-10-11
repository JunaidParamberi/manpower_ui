"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import type { PlanTier } from "@/config/plans";
import { normalizeClientRow } from "@/lib/clients/normalize-client-row";
import {
  listClients as fetchListClients,
  type ListClientsResult,
} from "@/lib/clients/client-queries";
import { getPlanLimit } from "@/lib/plan-usage/helpers";
import { removePinnedItemForDeletedTarget } from "@/lib/pinned/cleanup";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { parseClientCreateInput } from "@/lib/validations/client";
import type { ClientRow } from "@/types";

/** Server action for Client Components that need the clients list (e.g. dev test panel). */
export async function listClientsAction(): Promise<ListClientsResult> {
  return fetchListClients();
}

const uuidSchema = z.string().uuid();
const DELETE_CLIENT_WITH_PROJECTS_MESSAGE =
  "You can't delete this client yet because it has linked projects. Move or delete those projects first, then try again.";
const PLAN_TIERS: PlanTier[] = ["free", "starter", "pro", "agency"];
type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseClient>>;

function getDeleteClientErrorMessage(error: { code?: string; message: string }) {
  if (error.message.includes("projects_client_id_fkey")) {
    return DELETE_CLIENT_WITH_PROJECTS_MESSAGE;
  }

  return error.message;
}

function normalizePlanTier(value: string | null | undefined): PlanTier {
  return PLAN_TIERS.includes(value as PlanTier) ? (value as PlanTier) : "free";
}

async function assertClientLimitAllowsCreate(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const profileResult = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", userId)
    .maybeSingle();

  if (profileResult.error) {
    return { ok: false, message: "Could not verify your plan limits." };
  }

  const planTier = normalizePlanTier(profileResult.data?.plan_tier);
  const clientLimit = getPlanLimit(planTier, "clients");
  if (clientLimit === Infinity) {
    return { ok: true };
  }

  const countResult = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countResult.error) {
    return { ok: false, message: "Could not verify your client usage." };
  }

  const clientCount = countResult.count ?? 0;
  if (clientCount >= clientLimit) {
    return {
      ok: false,
      message: `Client limit reached (${clientCount}/${clientLimit}). Upgrade to add more clients.`,
    };
  }

  return { ok: true };
}

export type CreateClientResult =
  | { ok: true; client: ClientRow }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function createClient(input: unknown): Promise<CreateClientResult> {
  const parsed = parseClientCreateInput(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: flat.fieldErrors as Record<string, string[] | undefined>,
    };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const limitCheck = await assertClientLimitAllowsCreate(supabase, user.id);
  if (!limitCheck.ok) {
    return limitCheck;
  }

  const payload = {
    user_id: user.id,
    name: parsed.data.name,
    contact_name: parsed.data.contact_name,
    website: parsed.data.website,
    email: parsed.data.email,
    billing_email: parsed.data.billing_email,
    phone: parsed.data.phone,
    company: parsed.data.company,
    address: parsed.data.address,
    currency: parsed.data.currency,
    tax_id: parsed.data.tax_id,
    payment_terms_days: parsed.data.payment_terms_days,
    relationship_status: parsed.data.relationship_status,
    lead_source: parsed.data.lead_source,
    preferred_contact_method: parsed.data.preferred_contact_method,
    timezone: parsed.data.timezone,
    tags: parsed.data.tags,
    notes: parsed.data.notes,
  };

  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Client could not be created." };
  }

  revalidatePath("/clients");
  revalidateTag("clients");
  revalidateTag("dashboard");

  return { ok: true, client: normalizeClientRow(data) };
}

export type UpdateClientResult =
  | { ok: true; client: ClientRow }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function updateClient(
  id: string,
  input: unknown,
): Promise<UpdateClientResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid client." };
  }

  const parsed = parseClientCreateInput(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: flat.fieldErrors as Record<string, string[] | undefined>,
    };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const payload = {
    name: parsed.data.name,
    contact_name: parsed.data.contact_name,
    website: parsed.data.website,
    email: parsed.data.email,
    billing_email: parsed.data.billing_email,
    phone: parsed.data.phone,
    company: parsed.data.company,
    address: parsed.data.address,
    currency: parsed.data.currency,
    tax_id: parsed.data.tax_id,
    payment_terms_days: parsed.data.payment_terms_days,
    relationship_status: parsed.data.relationship_status,
    lead_source: parsed.data.lead_source,
    preferred_contact_method: parsed.data.preferred_contact_method,
    timezone: parsed.data.timezone,
    tags: parsed.data.tags,
    notes: parsed.data.notes,
  };

  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Client not found or could not be updated." };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${parsedId.data}`);
  revalidatePath(`/clients/${parsedId.data}/edit`);
  revalidateTag("clients");
  revalidateTag("dashboard");

  return { ok: true, client: normalizeClientRow(data) };
}

export type DeleteClientResult =
  | { ok: true }
  | { ok: false; message: string };

export async function deleteClientWithAllData(id: string): Promise<DeleteClientResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid client." };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: projectRows, error: projectFetchError } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", parsedId.data)
    .eq("user_id", user.id);

  if (projectFetchError) {
    return { ok: false, message: projectFetchError.message };
  }

  const projectIds = (projectRows ?? []).map((r) => r.id);

  const docQuery = supabase
    .from("documents")
    .delete()
    .eq("user_id", user.id)
    .eq("client_id", parsedId.data);

  const { error: docDeleteError } = projectIds.length > 0
    ? await supabase
        .from("documents")
        .delete()
        .eq("user_id", user.id)
        .or(`client_id.eq.${parsedId.data},project_id.in.(${projectIds.join(",")})`)
    : await docQuery;

  if (docDeleteError) {
    return { ok: false, message: docDeleteError.message };
  }

  if (projectIds.length > 0) {
    const { error: projDeleteError } = await supabase
      .from("projects")
      .delete()
      .eq("client_id", parsedId.data)
      .eq("user_id", user.id);

    if (projDeleteError) {
      return { ok: false, message: projDeleteError.message };
    }
  }

  const { error, count } = await supabase
    .from("clients")
    .delete({ count: "exact" })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (count === 0) {
    return { ok: false, message: "Client not found." };
  }

  await removePinnedItemForDeletedTarget({
    supabase,
    userId: user.id,
    itemType: "client",
    itemId: parsedId.data,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${parsedId.data}`);
  revalidateTag("clients");
  revalidateTag("projects");
  revalidateTag("documents");
  revalidateTag("dashboard");

  return { ok: true };
}

export async function deleteClient(id: string): Promise<DeleteClientResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid client." };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { error, count } = await supabase
    .from("clients")
    .delete({ count: "exact" })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: getDeleteClientErrorMessage(error) };
  }

  if (count === 0) {
    return { ok: false, message: "Client not found." };
  }

  await removePinnedItemForDeletedTarget({
    supabase,
    userId: user.id,
    itemType: "client",
    itemId: parsedId.data,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${parsedId.data}`);
  revalidatePath(`/clients/${parsedId.data}/edit`);
  revalidateTag("clients");
  revalidateTag("dashboard");

  return { ok: true };
}
