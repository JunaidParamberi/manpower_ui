import { z } from "zod";

import { PROFILE_LIMITS } from "@/lib/validations/profile";

/**
 * Client-side onboarding step 1; server still validates via mergeAndValidateProfile.
 */
export const onboardingProfileFormSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .max(PROFILE_LIMITS.fullName),
    company_name: z.string().max(PROFILE_LIMITS.companyName),
    vat_registered: z.boolean(),
    vat_number: z.string().max(PROFILE_LIMITS.vatNumber),
    gstin: z.string().max(PROFILE_LIMITS.gstin),
    vat_reg_no: z.string().max(PROFILE_LIMITS.vatRegNo),
    upi_id: z.string().max(PROFILE_LIMITS.upiId),
    default_tds_rate: z.number().min(0).max(100),
    address_line1: z.string().max(PROFILE_LIMITS.addressLine),
    address_line2: z.string().max(PROFILE_LIMITS.addressLine),
    address_city: z.string().max(PROFILE_LIMITS.city),
    address_region: z.string().max(PROFILE_LIMITS.region),
    address_postal_code: z.string().max(PROFILE_LIMITS.postalCode),
    address_country: z.string().max(2),
    default_currency: z.string().length(3),
  })
  .superRefine((data, ctx) => {
    if (data.vat_registered) {
      const n = data.vat_number.trim();
      if (n.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "VAT number is required when VAT registered.",
          path: ["vat_number"],
        });
      }
    }
    const cc = data.address_country.trim().toUpperCase();
    if (cc.length > 0 && cc.length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use a 2-letter ISO country code.",
        path: ["address_country"],
      });
    }
  });

export type OnboardingProfileFormValues = z.infer<
  typeof onboardingProfileFormSchema
>;
