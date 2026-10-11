"use client";

import { CookieConsentBanner } from "@/components/features/settings/legal/cookie-consent-banner";

type Props = {
  initialHasProfileConsent?: boolean;
};

export function CookieConsentRoot({ initialHasProfileConsent }: Props) {
  return (
    <CookieConsentBanner initialHasProfileConsent={initialHasProfileConsent} />
  );
}
