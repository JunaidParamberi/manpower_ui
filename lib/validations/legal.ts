import { z } from "zod";

export const CONSENT_TYPES = ["terms", "privacy", "cookies"] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

export const CONSENT_ACTIONS = ["accepted", "updated", "revoked"] as const;
export type ConsentAction = (typeof CONSENT_ACTIONS)[number];

export const cookiePreferencesSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
});

export type CookiePreferencesInput = z.infer<typeof cookiePreferencesSchema>;

export const storedCookieConsentSchema = cookiePreferencesSchema.extend({
  updatedAt: z.string().datetime({ offset: true }),
});

export type StoredCookieConsent = z.infer<typeof storedCookieConsentSchema>;

export const syncAnonymousConsentSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
  updatedAt: z.string().datetime({ offset: true }),
});

export type SyncAnonymousConsentInput = z.infer<
  typeof syncAnonymousConsentSchema
>;

export function isConsentType(value: string): value is ConsentType {
  return (CONSENT_TYPES as readonly string[]).includes(value);
}

export function isConsentAction(value: string): value is ConsentAction {
  return (CONSENT_ACTIONS as readonly string[]).includes(value);
}
