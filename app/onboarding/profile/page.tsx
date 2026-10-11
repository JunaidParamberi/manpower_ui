import { redirect } from "next/navigation";

import { ProfileOnboardingStep } from "@/components/onboarding/profile-onboarding-step";
import { getProfile } from "@/lib/profile/actions";

export const metadata = {
  title: "Profile",
};

export default async function OnboardingProfilePage() {
  const result = await getProfile();

  if (!result.ok) {
    redirect("/auth/login");
  }

  if (result.profile === null) {
    redirect("/auth/login");
  }

  return <ProfileOnboardingStep initialProfile={result.profile} />;
}
