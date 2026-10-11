import { redirect } from "next/navigation";

import { BrandKitForm } from "@/components/onboarding/brand-kit-form";
import { getBrandKit } from "@/lib/brand-kit/actions";
import { createClient } from "@/lib/supabase/server";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = {
  title: "Brand kit",
};

export default async function SettingsBrandPage() {
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
      <div className="flex flex-col gap-4">
        <PageHeader title="Brand kit" />
        <Alert variant="destructive">
          <AlertTitle>Could not load brand kit</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <BrandKitForm
        initialBrandKit={result.brandKit}
        variant="default"
        redirectAfterSave={false}
        submitLabel="Save changes"
      />
    </div>
  );
}
