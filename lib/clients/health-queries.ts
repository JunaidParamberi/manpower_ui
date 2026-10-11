"use server";

import { unstable_cache } from "next/cache";

import { getServerContext } from "@/lib/supabase/get-server-context";
import type { HealthBand, HealthSignal } from "@/lib/clients/health-facts";

export type ClientHealthSnapshotRow = {
  id: string;
  clientId: string;
  snapshotDate: string;
  score: number;
  band: HealthBand;
  facts: Record<string, unknown>;
  signals: HealthSignal[];
  /** Date through unstable_cache arrives as an ISO string. */
  createdAt: Date | string;
};

export type AtRiskClient = {
  clientId: string;
  clientName: string;
  score: number;
  band: HealthBand;
  topSignal: HealthSignal | null;
};

const AT_RISK_LIMIT_DEFAULT = 5;
const AT_RISK_BANDS = ["needs_attention", "at_risk"];

const _cachedGetLatestClientHealth = unstable_cache(
  async (userId: string, clientId: string): Promise<ClientHealthSnapshotRow | null> => {
    const { supabase } = await getServerContext();

    const { data } = await supabase
      .from("client_health_snapshots")
      .select("id, client_id, snapshot_date, score, band, facts, signals, created_at")
      .eq("user_id", userId)
      .eq("client_id", clientId)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return {
      id: data.id,
      clientId: data.client_id,
      snapshotDate: data.snapshot_date,
      score: data.score,
      band: data.band as HealthBand,
      facts: (data.facts ?? {}) as Record<string, unknown>,
      signals: (data.signals ?? []) as HealthSignal[],
      createdAt: data.created_at,
    };
  },
  ["latest-client-health"],
  { revalidate: 60, tags: ["client-health"] },
);

export async function getLatestClientHealth(
  clientId: string,
): Promise<ClientHealthSnapshotRow | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  return _cachedGetLatestClientHealth(user.id, clientId);
}

const AT_RISK_RECENCY_DAYS = 7;
const AT_RISK_QUERY_HEADROOM = 5;

const _cachedGetAtRiskClients = unstable_cache(
  async (userId: string, limit: number): Promise<AtRiskClient[]> => {
    const { supabase } = await getServerContext();

    const recencyCutoff = new Date();
    recencyCutoff.setUTCDate(recencyCutoff.getUTCDate() - AT_RISK_RECENCY_DAYS);
    const recencyCutoffDate = recencyCutoff.toISOString().slice(0, 10);

    const { data } = await supabase
      .from("client_health_snapshots")
      .select("client_id, score, band, signals, snapshot_date, clients(name)")
      .eq("user_id", userId)
      .gte("snapshot_date", recencyCutoffDate)
      .in("band", AT_RISK_BANDS)
      .order("score", { ascending: true })
      .limit(limit * AT_RISK_QUERY_HEADROOM);

    type ClientRel = { name?: string | null };
    type Row = {
      client_id: string;
      score: number;
      band: string;
      signals: HealthSignal[] | null;
      snapshot_date: string;
      clients: ClientRel | ClientRel[] | null;
    };

    // Rows can include multiple snapshots per client within the recency
    // window — keep only each client's most recent snapshot.
    const latestByClient = new Map<string, Row>();
    for (const row of (data ?? []) as Row[]) {
      const existing = latestByClient.get(row.client_id);
      if (!existing || row.snapshot_date > existing.snapshot_date) {
        latestByClient.set(row.client_id, row);
      }
    }

    return Array.from(latestByClient.values())
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
      .map((row) => {
        const clientRel = row.clients;
        const client = Array.isArray(clientRel) ? (clientRel[0] ?? null) : clientRel;
        const signals = (row.signals ?? []) as HealthSignal[];

        return {
          clientId: row.client_id,
          clientName: client?.name ?? "Unknown client",
          score: row.score,
          band: row.band as HealthBand,
          topSignal: signals[0] ?? null,
        };
      });
  },
  ["at-risk-clients"],
  { revalidate: 60, tags: ["client-health"] },
);

export async function getAtRiskClients(
  limit: number = AT_RISK_LIMIT_DEFAULT,
): Promise<AtRiskClient[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedGetAtRiskClients(user.id, limit);
}
