import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isPlanAtLeast } from "@/config/plans";
import { DeveloperDocs } from "@/components/features/settings/api/developer-docs";
import { getProfile } from "@/lib/profile/actions";
import { getServerContext } from "@/lib/supabase/get-server-context";

export const metadata: Metadata = { title: "Developer docs — API & integrations" };

export default async function ApiDocsPage() {
  const { user } = await getServerContext();
  if (!user) redirect("/auth/login");

  const profileResult = await getProfile();
  const planTier = profileResult.ok ? profileResult.profile?.plan_tier ?? "free" : "free";

  if (!isPlanAtLeast(planTier, "pro")) {
    redirect("/settings/api");
  }

  return (
    <div className="flex flex-col gap-8">
      <DeveloperDocs />
    </div>
  );
}
