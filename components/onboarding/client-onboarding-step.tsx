"use client";

import { OnboardingStep } from "@/components/onboarding/onboarding-step";
import { FirstClientOnboardingForm } from "@/components/onboarding/first-client-onboarding-form";

export function ClientOnboardingStep() {
  return (
    <OnboardingStep step={3}>
      <FirstClientOnboardingForm />
    </OnboardingStep>
  );
}
