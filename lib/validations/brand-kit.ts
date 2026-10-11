import { z } from "zod";

/** Match storage bucket `allowed_mime_types`. */
export const BRAND_LOGO_ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

export const BRAND_KIT_LIMITS = {
  font: 120,
  emailSignature: 5000,
} as const;

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a valid hex color (#rgb or #rrggbb).")
  .transform((s) => s.toLowerCase());

/**
 * Fields submitted from the brand kit form (no file — logo handled in the server action).
 */
export const brandKitFormSchema = z.object({
  primary_color: hexColor,
  secondary_color: hexColor,
  font: z
    .string()
    .trim()
    .min(1, "Font name is required.")
    .max(BRAND_KIT_LIMITS.font),
  /** Empty string is normalized to null in `saveBrandKit` (server). */
  email_signature: z.string().max(BRAND_KIT_LIMITS.emailSignature),
});

export type BrandKitFormValues = z.infer<typeof brandKitFormSchema>;
