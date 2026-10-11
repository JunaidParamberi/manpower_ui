/**
 * API key format helpers — dependency-free (no Node built-ins) so they can be
 * imported from client components and shared bundles. Anything touching
 * crypto lives in `keygen.ts` and runs server-side only.
 */

export const API_KEY_PREFIX = "ca_" as const;

export const API_KEY_LENGTH = API_KEY_PREFIX.length + 40;

/** Hex-only body after the prefix, e.g. `ca_1a2b3c4d…`. */
export const API_KEY_BODY_PATTERN = /^[a-f0-9]{40}$/;

const KEY_PATTERN = new RegExp(`^${API_KEY_PREFIX}[a-f0-9]{40}$`);

/** True when the presented credential looks like one of our keys at all. */
export function isApiKeyFormat(secret: string): boolean {
  return KEY_PATTERN.test(secret);
}