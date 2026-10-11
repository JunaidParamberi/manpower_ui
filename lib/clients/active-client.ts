import type { ClientOverviewRow } from "./clients-overview-queries";

export function pickMostRecentlyActiveClient(
  clients: ClientOverviewRow[],
): ClientOverviewRow | null {
  if (clients.length === 0) {
    return null;
  }

  return clients.reduce((mostRecent, candidate) => {
    if (!candidate.last_activity_at) {
      return mostRecent;
    }
    if (!mostRecent.last_activity_at) {
      return candidate;
    }
    return new Date(candidate.last_activity_at).getTime() >
      new Date(mostRecent.last_activity_at).getTime()
      ? candidate
      : mostRecent;
  }, clients[0]);
}
