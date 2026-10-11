"use client";

import type { ProfileRow } from "@/types";
import { OnboardingStep } from "@/components/onboarding/onboarding-step";
import { ProfileOnboardingForm } from "@/components/onboarding/profile-onboarding-form";

export function ProfileOnboardingStep({
  initialProfile,
}: {
  initialProfile: ProfileRow | null;
}) {
  return (
    <OnboardingStep step={1}>
      <ProfileOnboardingForm initialProfile={initialProfile} />
    </OnboardingStep>
  );
}
