/**
 * Deterministic user ids derived from the email address.
 *
 * The browser can only read/write the session cookie, never the JSON store, so
 * both sides must agree on the account id without talking to each other.
 * FNV-1a is used because it is identical in Node and the browser (no
 * `node:crypto`, no WebCrypto await), and the output is shaped like a UUID so
 * it flows through the app's `.uuid()` zod schemas untouched.
 */
export function userIdForEmail(email: string): string {
  const input = email.trim().toLowerCase();

  let hash = 2166136261;
  const words: number[] = [];
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
    if (i % 4 === 3) words.push(hash);
  }
  words.push(hash);
  while (words.length < 4) words.push((hash ^ words.length * 0x9e3779b9) >>> 0);

  const hex = (n: number, length: number): string =>
    (n >>> 0).toString(16).padStart(8, "0").slice(0, length);

  return [
    hex(words[0], 8),
    "0000",
    "4000",
    `80${hex(words[1], 2)}`,
    `${hex(words[2], 8)}${hex(words[3], 4)}`,
  ].join("-");
}

/** "jane.doe@example.com" → "Jane Doe" (used as the seeded display name). */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "demo";
  const parts = local.split(/[._\-+]/).filter(Boolean);
  const name = parts
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return name || "Demo User";
}
