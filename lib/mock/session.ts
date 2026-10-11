/**
 * Session cookie encoding shared by the browser mock and the server mock.
 *
 * The cookie is the single source of truth for "who is signed in": it is
 * readable by `document.cookie` (client components) *and* by Next's `cookies()`
 * (server components/actions), so no API route or network round trip is
 * needed for auth.
 *
 * Payload: `{ e: email, w: needsOnboarding, x: expiresAtEpochSeconds }`
 */
export const SESSION_COOKIE = "mock_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export type SessionPayload = {
  /** email */
  e: string;
  /** signed up through the sign-up form → show onboarding */
  w: number;
  /** expiry, epoch seconds */
  x: number;
};

export function encodeSession(email: string, needsOnboarding: boolean): string {
  const payload: SessionPayload = {
    e: email.trim().toLowerCase(),
    w: needsOnboarding ? 1 : 0,
    x: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  return encodeURIComponent(JSON.stringify(payload));
}

export function decodeSession(raw: string | undefined | null): SessionPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as SessionPayload;
    if (!parsed || typeof parsed.e !== "string" || !parsed.e.includes("@")) return null;
    if (typeof parsed.x !== "number" || parsed.x < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Minimal cookie-string parsing so the browser can share this module. */
export function readCookieString(cookieString: string, name: string): string | undefined {
  for (const part of cookieString.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1);
  }
  return undefined;
}
