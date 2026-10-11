import { z } from "zod";

import type { ProfileRow } from "@/types";

/** Max lengths aligned with UI / invoicing; adjust in one place. */
export const PROFILE_LIMITS = {
  fullName: 200,
  companyName: 200,
  vatNumber: 50,
  gstin: 30,
  vatRegNo: 50,
  upiId: 100,
  addressLine: 500,
  city: 200,
  region: 200,
  postalCode: 50,
} as const;

/** Optional patch field: trim; empty string becomes null; enforce max length. */
function optionalNullableTrimmed(max: number) {
  return z.preprocess((val: unknown) => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    if (typeof val !== "string") return val;
    const t = val.trim();
    return t === "" ? null : t;
  }, z.union([z.undefined(), z.null(), z.string().max(max)]));
}

const optionalCountryCode = z.preprocess((val: unknown) => {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (typeof val !== "string") return val;
  const t = val.trim();
  if (t === "") return null;
  return t.toUpperCase();
}, z.union([z.undefined(), z.null(), z.string().length(2).regex(/^[A-Z]{2}$/, "Use a 2-letter ISO country code")]));

const optionalCurrencyCode = z.preprocess((val: unknown) => {
  if (val === undefined) return undefined;
  if (typeof val !== "string") return val;
  const t = val.trim();
  if (t === "") return undefined;
  return t.toUpperCase();
}, z.union([z.undefined(), z.string().length(3).regex(/^[A-Z]{3}$/, "Use a 3-letter ISO currency code")]));

/**
 * Partial update from client. Omitted keys keep existing DB values after merge.
 */
export const profilePatchSchema = z
  .object({
    full_name: optionalNullableTrimmed(PROFILE_LIMITS.fullName),
    company_name: optionalNullableTrimmed(PROFILE_LIMITS.companyName),
    vat_registered: z.boolean().optional(),
    vat_number: optionalNullableTrimmed(PROFILE_LIMITS.vatNumber),
    gstin: optionalNullableTrimmed(PROFILE_LIMITS.gstin),
    vat_reg_no: optionalNullableTrimmed(PROFILE_LIMITS.vatRegNo),
    upi_id: z.preprocess((val: unknown) => {
      if (val === undefined) return undefined;
      if (val === null) return null;
      if (typeof val !== "string") return val;
      const t = val.trim();
      return t === "" ? null : t;
    }, z.union([z.undefined(), z.null(), z.string().max(PROFILE_LIMITS.upiId).regex(/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/, "Invalid UPI VPA (e.g. name@bank)")])),
    default_tds_rate: z.coerce.number().min(0).max(100).optional(),
    address_line1: optionalNullableTrimmed(PROFILE_LIMITS.addressLine),
    address_line2: optionalNullableTrimmed(PROFILE_LIMITS.addressLine),
    address_city: optionalNullableTrimmed(PROFILE_LIMITS.city),
    address_region: optionalNullableTrimmed(PROFILE_LIMITS.region),
    address_postal_code: optionalNullableTrimmed(PROFILE_LIMITS.postalCode),
    address_country: optionalCountryCode,
    default_currency: optionalCurrencyCode,
  })
  .strict();

export type ProfilePatchInput = z.infer<typeof profilePatchSchema>;

export type MergedProfile = {
  full_name: string | null;
  company_name: string | null;
  vat_registered: boolean;
  vat_number: string | null;
  gstin: string | null;
  vat_reg_no: string | null;
  upi_id: string | null;
  default_tds_rate: number;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_region: string | null;
  address_postal_code: string | null;
  address_country: string | null;
  default_currency: string;
};

const mergedProfileSchema = z
  .object({
    full_name: z.union([z.string().max(PROFILE_LIMITS.fullName), z.null()]),
    company_name: z.union([z.string().max(PROFILE_LIMITS.companyName), z.null()]),
    vat_registered: z.boolean(),
    vat_number: z.union([z.string().max(PROFILE_LIMITS.vatNumber), z.null()]),
    gstin: z.union([z.string().max(PROFILE_LIMITS.gstin), z.null()]),
    vat_reg_no: z.union([z.string().max(PROFILE_LIMITS.vatRegNo), z.null()]),
    upi_id: z.union([z.string().max(PROFILE_LIMITS.upiId).regex(/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/), z.null()]),
    default_tds_rate: z.number().min(0).max(100),
    address_line1: z.union([z.string().max(PROFILE_LIMITS.addressLine), z.null()]),
    address_line2: z.union([z.string().max(PROFILE_LIMITS.addressLine), z.null()]),
    address_city: z.union([z.string().max(PROFILE_LIMITS.city), z.null()]),
    address_region: z.union([z.string().max(PROFILE_LIMITS.region), z.null()]),
    address_postal_code: z.union([z.string().max(PROFILE_LIMITS.postalCode), z.null()]),
    address_country: z.union([
      z.string().length(2).regex(/^[A-Z]{2}$/),
      z.null(),
    ]),
    default_currency: z.string().length(3).regex(/^[A-Z]{3}$/),
  })
  .superRefine((data, ctx) => {
    if (!data.vat_registered) return;
    const n = data.vat_number?.trim() ?? "";
    if (n.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "VAT number is required when VAT registered.",
        path: ["vat_number"],
      });
    }
  });

function rowToMerged(row: ProfileRow): MergedProfile {
  return {
    full_name: row.full_name,
    company_name: row.company_name,
    vat_registered: row.vat_registered,
    vat_number: row.vat_number,
    gstin: row.gstin,
    vat_reg_no: row.vat_reg_no,
    upi_id: row.upi_id,
    default_tds_rate: row.default_tds_rate ?? 0,
    address_line1: row.address_line1,
    address_line2: row.address_line2,
    address_city: row.address_city,
    address_region: row.address_region,
    address_postal_code: row.address_postal_code,
    address_country: row.address_country
      ? row.address_country.trim().toUpperCase()
      : null,
    default_currency: row.default_currency,
  };
}

const emptyMerged = (): MergedProfile => ({
  full_name: null,
  company_name: null,
  vat_registered: false,
  vat_number: null,
  gstin: null,
  vat_reg_no: null,
  upi_id: null,
  default_tds_rate: 0,
  address_line1: null,
  address_line2: null,
  address_city: null,
  address_region: null,
  address_postal_code: null,
  address_country: null,
  default_currency: "USD",
});

function applyProfilePatch(base: MergedProfile, patch: ProfilePatchInput): MergedProfile {
  const out: MergedProfile = { ...base };
  (Object.entries(patch) as [keyof ProfilePatchInput, unknown][]).forEach(([key, value]) => {
    if (value !== undefined) {
      (out as Record<string, unknown>)[key] = value;
    }
  });
  return out;
}

/** Server Actions / JSON can omit keys or pass `undefined`; Zod union rejects `undefined` vs `null`. */
function coerceUndefinedToNull(m: MergedProfile): MergedProfile {
  return {
    full_name: m.full_name ?? null,
    company_name: m.company_name ?? null,
    vat_registered: m.vat_registered,
    vat_number: m.vat_number ?? null,
    gstin: m.gstin ?? null,
    vat_reg_no: m.vat_reg_no ?? null,
    upi_id: m.upi_id ?? null,
    default_tds_rate: m.default_tds_rate ?? 0,
    address_line1: m.address_line1 ?? null,
    address_line2: m.address_line2 ?? null,
    address_city: m.address_city ?? null,
    address_region: m.address_region ?? null,
    address_postal_code: m.address_postal_code ?? null,
    address_country: m.address_country ?? null,
    default_currency: m.default_currency ?? "USD",
  };
}

/**
 * Parses a patch, merges onto an existing profile (or defaults), validates VAT rule on merged state.
 */
export function mergeAndValidateProfile(
  existing: ProfileRow | null,
  patchInput: unknown,
): { success: true; data: MergedProfile } | { success: false; error: z.ZodError } {
  const patchResult = profilePatchSchema.safeParse(patchInput);
  if (!patchResult.success) {
    return { success: false, error: patchResult.error };
  }

  const base = existing ? rowToMerged(existing) : emptyMerged();
  let merged = coerceUndefinedToNull(applyProfilePatch(base, patchResult.data));

  if (merged.vat_registered === false) {
    merged = { ...merged, vat_number: null };
  }

  const parsed = mergedProfileSchema.safeParse(merged);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const d = parsed.data;
  return {
    success: true,
    data: {
      ...d,
      full_name: d.full_name === null ? null : d.full_name.trim() || null,
      company_name: d.company_name === null ? null : d.company_name.trim() || null,
      vat_number:
        d.vat_number === null ? null : d.vat_number.trim(),
      gstin: d.gstin === null ? null : d.gstin.trim() || null,
      vat_reg_no: d.vat_reg_no === null ? null : d.vat_reg_no.trim() || null,
      upi_id: d.upi_id === null ? null : d.upi_id.trim() || null,
      address_line1: d.address_line1 === null ? null : d.address_line1.trim() || null,
      address_line2: d.address_line2 === null ? null : d.address_line2.trim() || null,
      address_city: d.address_city === null ? null : d.address_city.trim() || null,
      address_region: d.address_region === null ? null : d.address_region.trim() || null,
      address_postal_code:
        d.address_postal_code === null ? null : d.address_postal_code.trim() || null,
    },
  };
}
