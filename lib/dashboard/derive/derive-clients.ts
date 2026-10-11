// lib/dashboard/derive/derive-clients.ts
import {
  buildClientHealthFacts,
  type ClientHealthInput,
  type HealthDocumentTouchInput,
  type HealthInvoiceInput,
  type HealthProjectInput,
} from "@/lib/clients/health-facts";
import type { AtRiskClient } from "@/lib/clients/health-queries";
import type { ClientFacts, ClientRow } from "@/lib/dashboard/snapshot-types";

/**
 * Above this, scoring every client inline would make the dashboard pay for
 * work the nightly scan exists to do — that is where the cron earns its place.
 */
export const LIVE_HEALTH_CLIENT_CAP = 25;

const DEFAULT_LIMIT = 5;

export type LiveHealthInput = {
  client: ClientHealthInput & { name: string };
  invoices: HealthInvoiceInput[];
  documents: HealthDocumentTouchInput[];
  projects: HealthProjectInput[];
  revenueLast90: number;
  revenuePrior90: number;
};

function worstFirst(a: ClientRow, b: ClientRow): number {
  return a.score - b.score;
}

export function deriveClients(args: {
  nowIso: string;
  snapshots: AtRiskClient[];
  liveInputs: LiveHealthInput[];
  limit?: number;
}): ClientFacts {
  const limit = args.limit ?? DEFAULT_LIMIT;

  if (args.snapshots.length > 0) {
    return {
      clients: [...args.snapshots].sort(worstFirst).slice(0, limit),
      cappedForLiveComputation: false,
      source: "nightly",
    };
  }

  if (args.liveInputs.length > LIVE_HEALTH_CLIENT_CAP) {
    return { clients: [], cappedForLiveComputation: true, source: "live" };
  }

  const rows: ClientRow[] = [];

  for (const input of args.liveInputs) {
    const facts = buildClientHealthFacts({
      client: input.client,
      invoices: input.invoices,
      documents: input.documents,
      projects: input.projects,
      revenueLast90: input.revenueLast90,
      revenuePrior90: input.revenuePrior90,
      nowIso: args.nowIso,
    });
    if (!facts) continue;

    const [topSignal] = facts.signals;
    rows.push({
      clientId: facts.clientId,
      clientName: input.client.name,
      score: facts.score,
      band: facts.band,
      topSignal: topSignal ?? null,
    });
  }

  return {
    clients: rows.sort(worstFirst).slice(0, limit),
    cappedForLiveComputation: false,
    source: "live",
  };
}
