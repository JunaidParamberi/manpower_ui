"use client";

import { useEffect } from "react";

import { COOKIE_CONSENT_STORAGE_KEY } from "@/config/legal";
import { syncAnonymousConsent } from "@/lib/legal/actions";
import { parseStoredConsent } from "@/lib/legal/cookie-prefs";

export function AnonymousConsentSync() {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
      if (!raw) return;

      const stored = parseStoredConsent(JSON.parse(raw));
      if (!stored) return;

      void syncAnonymousConsent(stored);
    } catch {
      // ignore malformed storage
    }
  }, []);

  return null;
}
