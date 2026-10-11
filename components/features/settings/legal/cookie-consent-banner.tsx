"use client";

import { useEffect, useState } from "react";
import { LegalPolicyLink } from "@/components/legal/legal-policy-link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  COOKIE_CATEGORIES,
  COOKIE_CONSENT_STORAGE_KEY,
  legalConfig,
} from "@/config/legal";
import {
  syncAnonymousConsent,
  updateCookiePreferences,
} from "@/lib/legal/actions";
import { parseStoredConsent } from "@/lib/legal/cookie-prefs";
import type { StoredCookieConsent } from "@/lib/validations/legal";
import { createClient } from "@/lib/supabase/client";

type Props = {
  initialHasProfileConsent?: boolean;
};

function readStoredConsent(): StoredCookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return parseStoredConsent(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeStoredConsent(prefs: StoredCookieConsent): void {
  window.localStorage.setItem(
    COOKIE_CONSENT_STORAGE_KEY,
    JSON.stringify(prefs),
  );
}

function buildConsent(analytics: boolean, marketing: boolean): StoredCookieConsent {
  return {
    analytics,
    marketing,
    updatedAt: new Date().toISOString(),
  };
}

async function persistConsent(prefs: StoredCookieConsent): Promise<void> {
  writeStoredConsent(prefs);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await syncAnonymousConsent(prefs);
  }
}

export function CookieConsentBanner({ initialHasProfileConsent = false }: Props) {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      setAnalytics(stored.analytics);
      setMarketing(stored.marketing);
    }

    if (!initialHasProfileConsent && !stored) {
      setVisible(true);
    }
  }, [initialHasProfileConsent]);

  async function savePrefs(nextAnalytics: boolean, nextMarketing: boolean) {
    setPending(true);
    try {
      const prefs = buildConsent(nextAnalytics, nextMarketing);
      setAnalytics(nextAnalytics);
      setMarketing(nextMarketing);
      await persistConsent(prefs);
      setVisible(false);
      setCustomizing(false);
    } finally {
      setPending(false);
    }
  }

  async function onAcceptAll() {
    await savePrefs(true, true);
  }

  async function onEssentialOnly() {
    await savePrefs(false, false);
  }

  async function onSaveCustom() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setPending(true);
      try {
        const result = await updateCookiePreferences({ analytics, marketing });
        if (result.ok) {
          writeStoredConsent(buildConsent(analytics, marketing));
          setVisible(false);
          setCustomizing(false);
        }
      } finally {
        setPending(false);
      }
      return;
    }

    await savePrefs(analytics, marketing);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur-sm sm:p-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">We use cookies</p>
          <p className="text-sm text-muted-foreground">
            Essential cookies keep you signed in. Optional cookies help us improve
            Manpower. See our{" "}
            <LegalPolicyLink
              policy="privacy"
              className="text-foreground underline underline-offset-4"
            >
              Privacy Policy
            </LegalPolicyLink>
            .
          </p>
        </div>

        {customizing ? (
          <div className="flex flex-col gap-3">
            {COOKIE_CATEGORIES.map((category) => {
              const checked =
                category.id === "essential"
                  ? true
                  : category.id === "analytics"
                    ? analytics
                    : marketing;

              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
                >
                  <div>
                    <Label className="text-sm">{category.label}</Label>
                    <p className="text-xs text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  <Switch
                    checked={checked}
                    disabled={category.required || pending}
                    onCheckedChange={
                      category.id === "analytics"
                        ? setAnalytics
                        : category.id === "marketing"
                          ? setMarketing
                          : undefined
                    }
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onAcceptAll}
            disabled={pending}
          >
            Accept all
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onEssentialOnly}
            disabled={pending}
          >
            Essential only
          </Button>
          {customizing ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onSaveCustom}
              disabled={pending}
            >
              Save choices
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setCustomizing(true)}
              disabled={pending}
            >
              Customize
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
