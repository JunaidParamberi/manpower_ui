import { legalConfig } from "@/config/legal";

export const LEGAL_LINK_TARGET = "_blank" as const;
export const LEGAL_LINK_REL = "noopener noreferrer" as const;

/** Absolute URL for policy pages (new-tab links from in-app flows). */
export function policyAbsoluteUrl(
  path: typeof legalConfig.termsPath | typeof legalConfig.privacyPath,
): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (base?.startsWith("http")) {
    return `${base}${path}`;
  }
  return path;
}

export const termsPolicyUrl = () => policyAbsoluteUrl(legalConfig.termsPath);
export const privacyPolicyUrl = () => policyAbsoluteUrl(legalConfig.privacyPath);
