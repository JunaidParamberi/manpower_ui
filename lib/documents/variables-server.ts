import "server-only";

import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type { VariableContext } from "@/lib/documents/variables";

/**
 * Everything in VariableContext except `now` — `now` must never cross the
 * unstable_cache boundary (Date -> ISO string on serialization) so it is
 * attached fresh on every call, outside the cached worker.
 */
type CachedVariableData = Omit<VariableContext, "now">;

const _cachedVariableContextData = unstable_cache(
  async (
    userId: string,
    clientId: string,
    projectId: string,
  ): Promise<CachedVariableData> => {
    const supabase = createAdminClient();

    const [brandRes, profileRes, clientRes, projectRes] = await Promise.all([
      supabase
        .from("brand_kits")
        .select("primary_color, email_signature, logo_url")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select(
          "company_name, full_name, address_line1, address_line2, address_city, address_region, address_postal_code, address_country, vat_number, gstin, vat_reg_no",
        )
        .eq("id", userId)
        .maybeSingle(),
      clientId
        ? supabase
            .from("clients")
            .select(
              "name, contact_name, email, billing_email, company, phone, address, website, tax_id, payment_terms_days",
            )
            .eq("id", clientId)
            .eq("user_id", userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      projectId
        ? supabase
            .from("projects")
            .select("title")
            .eq("id", projectId)
            .eq("user_id", userId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const ctx: CachedVariableData = {
      client: null,
      project: null,
      brand: null,
      sender: null,
    };

    const bk = brandRes.data;
    if (bk) {
      ctx.brand = {
        business_name: null,
        primary_color: bk.primary_color?.trim().toLowerCase() || null,
        email_signature: bk.email_signature ?? null,
        logo_url: bk.logo_url ?? null,
      };
    }

    const profile = profileRes.data;
    if (profile) {
      const business =
        (profile.company_name && profile.company_name.trim()) ||
        (profile.full_name && profile.full_name.trim()) ||
        null;
      ctx.brand = {
        business_name: business,
        primary_color: ctx.brand?.primary_color ?? null,
        email_signature: ctx.brand?.email_signature ?? null,
        logo_url: ctx.brand?.logo_url ?? null,
      };
      ctx.sender = {
        name: profile.full_name?.trim() || null,
        company_name: profile.company_name?.trim() || null,
        // Email is not on the profiles row; the consumer attaches it from auth.
        email: null,
        address_line1: profile.address_line1 ?? null,
        address_line2: profile.address_line2 ?? null,
        city: profile.address_city ?? null,
        region: profile.address_region ?? null,
        postal_code: profile.address_postal_code ?? null,
        country: profile.address_country ?? null,
        vat_number: profile.vat_number ?? null,
        gstin: profile.gstin ?? null,
        vat_reg_no: profile.vat_reg_no ?? null,
      };
    }

    const client = clientRes.data;
    if (client) {
      ctx.client = {
        name: client.name,
        contact_name: client.contact_name ?? null,
        email: client.email ?? null,
        billing_email: client.billing_email ?? null,
        company: client.company ?? null,
        phone: client.phone ?? null,
        address: client.address ?? null,
        website: client.website ?? null,
        tax_id: client.tax_id ?? null,
        payment_terms_days:
          client.payment_terms_days === null ||
          client.payment_terms_days === undefined
            ? null
            : String(client.payment_terms_days),
      };
    }

    const project = projectRes.data;
    if (project) {
      ctx.project = { title: project.title };
    }

    return ctx;
  },
  ["documents-variable-context"],
  { revalidate: 60, tags: ["documents", "clients", "projects", "profile"] },
);

/**
 * Build a variable substitution context by reading the active user's client,
 * project, brand kit, and profile. Pass nulls to skip a join. Safe to call
 * from server components / actions only.
 */
export async function buildVariableContext(args: {
  clientId?: string | null;
  projectId?: string | null;
}): Promise<VariableContext> {
  const now = new Date();
  const { user } = await getServerContext();

  if (!user) {
    return { client: null, project: null, brand: null, sender: null, now };
  }

  const data = await _cachedVariableContextData(
    user.id,
    args.clientId ?? "",
    args.projectId ?? "",
  );

  return {
    ...data,
    sender: data.sender ? { ...data.sender, email: user.email ?? null } : null,
    now,
  };
}
