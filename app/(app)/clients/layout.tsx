import type { Metadata } from "next";
import type { ReactNode } from "react";

import { listClientsOverview } from "@/lib/clients/clients-overview-queries";
import { getProfile } from "@/lib/profile/actions";
import { getPlanLimit } from "@/lib/plan-usage/helpers";
import { formatCurrency } from "@/lib/utils/format";
import { sectionTitleTemplate } from "@/lib/metadata";
import { ClientsShell } from "@/components/features/clients/overview/clients-shell";
import type { PlanTier } from "@/config/plans";

export const metadata: Metadata = {
  title: {
    default: "Clients",
    template: sectionTitleTemplate("Clients"),
  },
};

export default async function ClientsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [clientsResult, profileResult] = await Promise.all([
    listClientsOverview(),
    getProfile(),
  ]);

  const clients = clientsResult.ok ? clientsResult.clients : [];
  const planTier = (profileResult.ok && profileResult.profile?.plan_tier
    ? profileResult.profile.plan_tier
    : "free") as PlanTier;
  const profileDefaultCurrency =
    (profileResult.ok && profileResult.profile?.default_currency) || "USD";
  const clientLimit = getPlanLimit(planTier, "clients");
  const atLimit = clients.length >= clientLimit;
  const totalRevenue = clients.reduce((sum, client) => sum + client.revenue_total, 0);
  const currencies = new Set(
    clients.map((client) => client.currency ?? profileDefaultCurrency),
  );
  const defaultCurrency =
    clients.find((client) => client.currency)?.currency ?? profileDefaultCurrency;
  const revenueLabel =
    currencies.size > 1
      ? "Multiple currencies"
      : `${formatCurrency(totalRevenue, defaultCurrency)} lifetime`;

  return (
    <ClientsShell
      clients={clients}
      defaultCurrency={profileDefaultCurrency}
      atLimit={atLimit}
      planTier={planTier}
      clientLimit={clientLimit}
      revenueLabel={revenueLabel}
    >
      {children}
    </ClientsShell>
  );
}
