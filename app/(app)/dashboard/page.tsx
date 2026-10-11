import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { ActivityFeed } from "@/components/features/dashboard/activity-feed";
import { BriefCard } from "@/components/features/dashboard/brief-card";
import { ClientsCard } from "@/components/features/dashboard/clients-card";
import { DashboardLanes } from "@/components/features/dashboard/dashboard-lanes";
import { MoneyRow } from "@/components/features/dashboard/money-row";
import { QueueSection } from "@/components/features/dashboard/queue-section";
import { RevenueCard } from "@/components/features/dashboard/revenue-card";
import { WorkCard } from "@/components/features/dashboard/work-card";
import { PlanLimitBanner } from "@/components/features/billing/plan-limit-banner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import type { PlanTier } from "@/config/plans";
import { getDashboardLayout } from "@/lib/dashboard/layout-queries";
import { getDashboardSnapshot } from "@/lib/dashboard/snapshot";
import { parseRevenueRangeParam } from "@/lib/finance/date-utils";
import { getProfile } from "@/lib/profile/actions";
import { formatCurrency } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Dashboard" };

type SearchParams = Promise<{ revenue?: string }>;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function todayEyebrow(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());
}

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const result = await getProfile();
  if (!result.ok || result.profile === null) redirect("/auth/login");

  const firstName = result.profile.full_name?.trim().split(/\s+/)[0] ?? "there";
  const planTier = (result.profile.plan_tier ?? "free") as PlanTier;
  const profileCurrency = result.profile.default_currency ?? "USD";
  const revenueRangeId = parseRevenueRangeParam((await searchParams).revenue);

  const [snapshot, layout] = await Promise.all([
    getDashboardSnapshot({ revenueRange: revenueRangeId, planTier }),
    getDashboardLayout(),
  ]);

  const subtitleParts: string[] = [];
  if (snapshot.queue.length > 0) {
    subtitleParts.push(
      `${snapshot.queue.length} thing${snapshot.queue.length === 1 ? "" : "s"} need${snapshot.queue.length === 1 ? "s" : ""} you`,
    );
  }
  if (snapshot.money.outstanding > 0) {
    subtitleParts.push(
      `${formatCurrency(snapshot.money.outstanding, snapshot.currency)} outstanding`,
    );
  }
  const subtitle = subtitleParts.length > 0 ? subtitleParts.join(" · ") : "All clear today.";

  return (
    <div className="flex flex-col gap-5">
      <PlanLimitBanner />

      <PageHeader
        eyebrow={todayEyebrow()}
        title={`${greeting()}, ${firstName}.`}
        description={subtitle}
        actions={
          <Button size="sm" nativeButton={false} render={<Link href="/documents/new?type=invoice" />}>
            <Plus data-icon="inline-start" />
            New invoice
          </Button>
        }
      />

      <MoneyRow money={snapshot.money} />

      <DashboardLanes
        layout={layout}
        main={[
          {
            id: "queue",
            node: <QueueSection items={snapshot.queue} snoozedCount={snapshot.snoozedCount} />,
          },
          {
            id: "revenue",
            node: (
              <RevenueCard
                data={snapshot.revenue}
                currency={snapshot.currency}
                rangeId={revenueRangeId}
              />
            ),
          },
          {
            id: "activity",
            node: <ActivityFeed events={snapshot.activity} fallbackCurrency={snapshot.currency} />,
          },
        ]}
        rail={[
          { id: "brief", node: <BriefCard brief={snapshot.brief} /> },
          { id: "work", node: <WorkCard work={snapshot.work} currency={profileCurrency} /> },
          { id: "clients", node: <ClientsCard clients={snapshot.clients} /> },
        ]}
      />
    </div>
  );
}