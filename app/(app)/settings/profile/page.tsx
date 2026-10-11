import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileSettingsForm } from "@/components/features/settings/profile-form";
import { TaxDefaultsForm } from "@/components/features/settings/tax-defaults-form";
import { getProfile } from "@/lib/profile/actions";
import type { TaxMode } from "@/lib/documents/tax/compute-tax";

export const metadata: Metadata = { title: "Profile" };

export default async function SettingsProfilePage() {
  const result = await getProfile();
  if (!result.ok || result.profile === null) redirect("/auth/login");

  return (
    <div className="flex flex-col gap-8">
      <ProfileSettingsForm profile={result.profile} />
      <TaxDefaultsForm
        defaultMode={(result.profile.default_tax_mode ?? "none") as TaxMode}
        defaultRate={result.profile.default_tax_rate ?? 0}
      />
    </div>
  );
}
