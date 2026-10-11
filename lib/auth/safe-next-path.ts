const PROBE_ORIGIN = "https://next.invalid";

/**
 * Only same-origin relative paths survive. Browsers strip tabs/newlines and
 * treat `\` as `/` while parsing, so `/\t/evil.com` or `/\evil.com` would
 * resolve off-site — reject control chars and backslashes outright, then
 * confirm the path still resolves to our own origin.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback;
  try {
    if (new URL(value, PROBE_ORIGIN).origin !== PROBE_ORIGIN) return fallback;
  } catch {
    return fallback;
  }
  return value;
}
