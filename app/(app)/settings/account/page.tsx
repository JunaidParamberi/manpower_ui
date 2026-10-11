import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangeEmailForm } from "@/components/features/settings/account/change-email-form";
import { ChangePasswordForm } from "@/components/features/settings/account/change-password-form";
import { DeleteAccountSection } from "@/components/features/settings/account/delete-account-section";
import { ExportDataSection } from "@/components/features/settings/account/export-data-section";
import { SessionsSection } from "@/components/features/settings/account/sessions-section";
import { getServerContext } from "@/lib/supabase/get-server-context";

export const metadata: Metadata = { title: "Account" };

export default async function SettingsAccountPage() {
  const { user } = await getServerContext();
  if (!user?.email) redirect("/auth/login");

  return (
    <div className="flex flex-col gap-8">
      <ChangeEmailForm currentEmail={user.email} />
      <ChangePasswordForm email={user.email} />
      <SessionsSection />
      <ExportDataSection />
      <DeleteAccountSection />
    </div>
  );
}
