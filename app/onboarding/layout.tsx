import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AnonymousConsentSync } from "@/components/features/settings/legal/anonymous-consent-sync";
import { LegalAcceptanceGate } from "@/components/features/settings/legal/legal-acceptance-gate";
import { getProfile } from "@/lib/profile/actions";
import { needsLegalAcceptance } from "@/lib/legal/consent-queries";
import { getRequiredOnboardingPath } from "@/lib/onboarding/status";
import { sectionTitleTemplate } from "@/lib/metadata";

export const metadata: Metadata = {
  title: {
    default: "Onboarding",
    template: sectionTitleTemplate("Onboarding"),
  },
};

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "";

  const profileResult = await getProfile();

  if (!profileResult.ok) redirect("/auth/login");
  if (profileResult.profile === null) redirect("/auth/login");

  const required = getRequiredOnboardingPath(profileResult.profile);
  if (required === null) redirect("/dashboard");

  const pathMatches =
    pathname === required || pathname.startsWith(`${required}/`);
  if (!pathMatches) redirect(required);

  const legalAcceptanceRequired = await needsLegalAcceptance();

  return (
    <>
      <AnonymousConsentSync />
      <LegalAcceptanceGate needsAcceptance={legalAcceptanceRequired} />
      {children}
    </>
  );
}
