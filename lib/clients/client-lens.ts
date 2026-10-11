import { daysBetweenIso } from "@/lib/clients/health-facts";

export type ClientLens = "all" | "needs-you" | "healthy" | "quiet";
export type ClientGroup = "needs-you" | "healthy" | "quiet" | "other";

export const QUIET_AFTER_DAYS = 60;
/** Bottom of the "healthy" band in lib/clients/health-facts.ts; below it is needs attention / at risk. */
export const HEALTHY_MIN_SCORE = 55;

export const CLIENT_LENSES: ReadonlyArray<{ id: ClientLens; label: string }> = [
  { id: "all", label: "All" },
  { id: "needs-you", label: "Needs you" },
  { id: "healthy", label: "Healthy" },
  { id: "quiet", label: "Gone quiet" },
];

export const CLIENT_GROUPS: ReadonlyArray<{ id: ClientGroup; label: string }> = [
  { id: "needs-you", label: "Needs you" },
  { id: "healthy", label: "Healthy" },
  { id: "quiet", label: "Gone quiet" },
  { id: "other", label: "Other" },
];

type LensClient = {
  health_score: number | null;
  overdue_total: number;
  last_activity_at: string | null;
};

export function clientGroupOf(client: LensClient, nowIso: string): ClientGroup {
  if (client.overdue_total > 0) return "needs-you";
  if (client.health_score !== null && client.health_score < HEALTHY_MIN_SCORE) return "needs-you";
  if (!client.last_activity_at || daysBetweenIso(client.last_activity_at, nowIso) > QUIET_AFTER_DAYS) return "quiet";
  if (client.health_score !== null) return "healthy";
  return "other";
}

export function matchesClientLens(client: LensClient, lens: ClientLens, nowIso: string): boolean {
  return lens === "all" || clientGroupOf(client, nowIso) === lens;
}

export function countClientLenses(clients: LensClient[], nowIso: string): Record<ClientLens, number> {
  const counts: Record<ClientLens, number> = { all: clients.length, "needs-you": 0, healthy: 0, quiet: 0 };
  for (const client of clients) {
    const group = clientGroupOf(client, nowIso);
    if (group !== "other") counts[group] += 1;
  }
  return counts;
}

export function parseClientLens(value: string | null | undefined): ClientLens {
  return value === "needs-you" || value === "healthy" || value === "quiet" ? value : "all";
}
