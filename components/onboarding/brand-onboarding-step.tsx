"use client";

import type { BrandKitRow } from "@/types";
import { OnboardingStep } from "@/components/onboarding/onboarding-step";
import { BrandKitForm } from "@/components/onboarding/brand-kit-form";

export function BrandOnboardingStep({
  initialBrandKit,
}: {
  initialBrandKit: BrandKitRow | null;
}) {
  return (
    <OnboardingStep step={2}>
      <BrandKitForm
        initialBrandKit={initialBrandKit}
        variant="onboarding"
        redirectAfterSave="/onboarding/client"
      />
    </OnboardingStep>
  );
}
