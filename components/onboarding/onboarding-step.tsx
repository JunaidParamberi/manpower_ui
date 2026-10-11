"use client";

import { OnboardingPageShell } from "@/components/onboarding/onboarding-page-shell";

export function OnboardingStep({
  step,
  children,
}: {
  step: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  return <OnboardingPageShell step={step}>{children}</OnboardingPageShell>;
}
