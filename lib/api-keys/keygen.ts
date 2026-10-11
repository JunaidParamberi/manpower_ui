import { createHash, randomBytes } from "node:crypto";

import { API_KEY_PREFIX } from "./key-format";

export * from "./key-format";
export { API_KEY_PREFIX, API_KEY_LENGTH, API_KEY_BODY_PATTERN, isApiKeyFormat } from "./key-format";

/** Full secret shape. `prefix` is the short recognisable form shown in the UI. */
export type GeneratedApiKey = {
  /** Full plaintext secret — returned exactly once, never stored. */
  secret: string;
  /** First 12 chars, e.g. `ca_1a2b3c4d`. Stored for display/recognition. */
  prefix: string;
  /** SHA-256 hex digest of `secret`. This is what the DB stores. */
  hash: string;
};

export function generateApiKey(): GeneratedApiKey {
  const secret = `${API_KEY_PREFIX}${randomBytes(20).toString("hex")}`;
  return { secret, prefix: secret.slice(0, 12), hash: hashApiKey(secret) };
}

/** Deterministic SHA-256 digest used both at creation and at authentication. */
export function hashApiKey(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}