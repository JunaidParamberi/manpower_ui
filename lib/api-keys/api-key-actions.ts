"use server";

import { revalidateTag } from "next/cache";

import { isPlanAtLeast, type PlanTier } from "@/config/plans";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type { ApiKeyRow } from "./api-key-queries";
import {
  createApiKeySchema,
  revokeApiKeySchema,
  type ApiKeyTypeValue,
} from "./api-key-validations";
import { generateApiKey } from "./keygen";

const PLAN_TIERS: PlanTier[] = ["free", "starter", "pro", "agency"];

function normalizePlanTier(value: string | null | undefined): PlanTier {
  return PLAN_TIERS.includes(value as PlanTier) ? (value as PlanTier) : "free";
}

/**
 * Pro-tier gate for creating API keys. Public API access is a Pro feature
 * (see `config/plans.ts`), inherited by the Agency tier.
 */
async function requireProTier(
  supabase: Awaited<ReturnType<typeof getServerContext>>["supabase"],
  userId: string,
): Promise<{ ok: true; planTier: PlanTier } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "Could not verify your plan." };
  }

  const planTier = normalizePlanTier(data?.plan_tier);
  if (!isPlanAtLeast(planTier, "pro")) {
    return {
      ok: false,
      error:
        "API keys are a Pro feature — upgrade your plan to create one.",
    };
  }
  return { ok: true, planTier };
}

export type CreateApiKeyResult =
  | {
      ok: true;
      /** Stored row (never includes the secret). */
      apiKey: ApiKeyRow;
      /** Raw secret — shown exactly once, then cannot be recovered. */
      secret: string;
    }
  | { ok: false; error: string };

export async function createApiKey(input: {
  name: string;
  type?: ApiKeyTypeValue;
  description?: string;
  scopes?: string[];
  tools?: Record<string, boolean>;
  expiresAt?: string | null;
}): Promise<CreateApiKeyResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = createApiKeySchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Invalid API key settings." };
  }

  const gate = await requireProTier(supabase, user.id);
  if (!gate.ok) return gate;

  let expiresAt: string | null = null;
  if (parsed.data.expiresAt) {
    const date = new Date(parsed.data.expiresAt);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, error: "That expiry date is not valid." };
    }
    if (date.getTime() <= Date.now()) {
      return { ok: false, error: "Expiry must be in the future." };
    }
    expiresAt = date.toISOString();
  }

  const { secret, prefix, hash } = generateApiKey();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description,
      scopes: parsed.data.scopes,
      tools: parsed.data.tools,
      key_prefix: prefix,
      key_hash: hash,
      expires_at: expiresAt,
    })
    .select(
      "id, name, type, description, key_prefix, scopes, tools, last_used_at, expires_at, revoked_at, created_at",
    )
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not create the API key." };
  }

  revalidateTag("api-keys");
  return { ok: true, apiKey: data as ApiKeyRow, secret };
}

export type RevokeApiKeyResult = { ok: true } | { ok: false; error: string };

export async function revokeApiKey(id: string): Promise<RevokeApiKeyResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = revokeApiKeySchema.safeParse({ id });
  if (!parsed.success) {
    return { ok: false, error: "Invalid API key." };
  }

  const { error, data } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { ok: false, error: "That API key could not be revoked." };
  }

  revalidateTag("api-keys");
  return { ok: true };
}