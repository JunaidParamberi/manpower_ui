/** Current policy version recorded in consent_log rows. Bump when policy content changes. */
export const POLICY_VERSION = "2026-07-01" as const;

/** In-app policy routes (hosted on app.manpower.app, not the marketing site). */
export const TERMS_PATH = "/terms" as const;
export const PRIVACY_PATH = "/privacy" as const;

export const legalConfig = {
  termsPath: TERMS_PATH,
  privacyPath: PRIVACY_PATH,
  /** @deprecated Use termsPath — kept for callers expecting termsUrl */
  termsUrl: TERMS_PATH,
  /** @deprecated Use privacyPath — kept for callers expecting privacyUrl */
  privacyUrl: PRIVACY_PATH,
  policyVersion: POLICY_VERSION,
} as const;

export const COOKIE_CONSENT_STORAGE_KEY = "manpower-cookie-consent" as const;
export const PENDING_LEGAL_ACCEPTANCE_KEY = "manpower-pending-legal-acceptance" as const;

export const COOKIE_CATEGORIES = [
  {
    id: "essential" as const,
    label: "Essential",
    description:
      "Required for sign-in, security, and core app features. Always active.",
    required: true,
  },
  {
    id: "analytics" as const,
    label: "Analytics",
    description:
      "Helps us understand how the product is used so we can improve it.",
    required: false,
  },
  {
    id: "marketing" as const,
    label: "Marketing",
    description:
      "Used for product updates and promotional messages you may see elsewhere.",
    required: false,
  },
] as const;

export type CookieCategoryId = (typeof COOKIE_CATEGORIES)[number]["id"];
