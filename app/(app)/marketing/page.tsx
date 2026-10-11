import type { Metadata } from "next";

import { MarketingView } from "@/components/features/marketing/marketing-view";
import { listClients } from "@/lib/clients/client-queries";
import { listCampaigns } from "@/lib/marketing/campaign-queries";
import {
  getMonthPosts,
  getUnscheduledPosts,
  getWeekPosts,
} from "@/lib/marketing/content-post-queries";
import { parseMarketingViewParams } from "@/lib/marketing/marketing-view-params";

export const metadata: Metadata = { title: "Marketing" };

type SearchParams = Promise<{
  view?: string;
  month?: string;
  week?: string;
  client?: string;
  platform?: string;
  status?: string;
  campaign?: string;
}>;

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const raw = await searchParams;
  const params = parseMarketingViewParams(raw, new Date());

  // Week view fetches a week window; month and agenda views both work off the
  // month window.
  const periodPostsPromise =
    params.view === "week" ? getWeekPosts(params.week) : getMonthPosts(params.month);

  const [periodPosts, unscheduledPosts, campaigns, clientsResult] =
    await Promise.all([
      periodPostsPromise,
      getUnscheduledPosts(),
      listCampaigns(),
      listClients(),
    ]);

  const clients = clientsResult.ok
    ? clientsResult.clients.map((client) => ({
        id: client.id,
        name: client.name,
      }))
    : [];

  return (
    <MarketingView
      params={params}
      periodPosts={periodPosts}
      unscheduledPosts={unscheduledPosts}
      campaigns={campaigns}
      clients={clients}
    />
  );
}
