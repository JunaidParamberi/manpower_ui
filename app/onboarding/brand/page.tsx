import { redirect } from "next/navigation";

import { BrandOnboardingStep } from "@/components/onboarding/brand-onboarding-step";
import { getBrandKit } from "@/lib/brand-kit/actions";
import { createClient } from "@/lib/supabase/server";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata = {
  title: "Brand kit",
};

export default async function OnboardingBrandPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const result = await getBrandKit();

  if (!result.ok) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load brand kit</AlertTitle>
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
    );
  }

  return <BrandOnboardingStep initialBrandKit={result.brandKit} />;
}
