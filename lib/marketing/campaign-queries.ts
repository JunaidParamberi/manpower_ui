import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { pickEmbed } from "@/lib/supabase/pick-embed";

export type CampaignRow = {
  id: string;
  name: string;
  clientId: string | null;
  clientName: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  postCount: number;
};

// One round trip: the client label and the post count come back as nested
// selects rather than two follow-up queries.
const CAMPAIGN_SELECT =
  "id, name, client_id, start_date, end_date, clients(id, name), content_posts(count)" as const;

type CampaignRowRaw = {
  id: string;
  name: string;
  client_id: string | null;
  start_date: string;
  end_date: string;
  clients?: unknown;
  content_posts?: unknown;
};

/** PostgREST returns an aggregate nested select as `[{ count: n }]`. */
function readCount(raw: unknown): number {
  const node = Array.isArray(raw) ? raw[0] : raw;
  if (node && typeof node === "object" && "count" in node) {
    const value = (node as Record<string, unknown>).count;
    return typeof value === "number" ? value : 0;
  }
  return 0;
}

function normalizeCampaignRow(row: CampaignRowRaw): CampaignRow {
  const clientEmbed = pickEmbed(row.clients, "name");
  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id,
    clientName: clientEmbed ? clientEmbed.name : null,
    startDate: row.start_date,
    endDate: row.end_date,
    postCount: readCount(row.content_posts),
  };
}

const _cachedCampaigns = unstable_cache(
  async (userId: string): Promise<CampaignRow[]> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("content_campaigns")
      .select(CAMPAIGN_SELECT)
      .eq("user_id", userId)
      .order("start_date", { ascending: false })
      .limit(50);

    if (error) {
      return [];
    }

    return (data ?? []).map((row) => normalizeCampaignRow(row as CampaignRowRaw));
  },
  ["content-campaigns-list"],
  { revalidate: 60, tags: ["content-campaigns"] },
);

export async function listCampaigns(): Promise<CampaignRow[]> {
  const { user } = await getServerContext();
  if (!user) {
    return [];
  }
  return _cachedCampaigns(user.id);
}
