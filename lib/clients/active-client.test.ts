import { describe, expect, it } from "vitest";

import { pickMostRecentlyActiveClient } from "./active-client";
import type { ClientOverviewRow } from "./clients-overview-queries";

function makeClient(overrides: Partial<ClientOverviewRow> = {}): ClientOverviewRow {
  return {
    id: "client-1",
    user_id: "user-1",
    name: "Nova Retail FZ",
    contact_name: null,
    website: null,
    email: null,
    billing_email: null,
    phone: null,
    company: null,
    address: null,
    currency: null,
    tax_id: null,
    payment_terms_days: null,
    relationship_status: null,
    lead_source: null,
    preferred_contact_method: null,
    timezone: null,
    tags: [],
    notes: null,
    health_score: null,
    portal_token: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    projects_count: 0,
    revenue_total: 0,
    last_activity_at: null,
    recent_documents: [],
    ...overrides,
  } as ClientOverviewRow;
}

describe("pickMostRecentlyActiveClient", () => {
  it("returns null for an empty list", () => {
    expect(pickMostRecentlyActiveClient([])).toBeNull();
  });

  it("returns the only client when there is one", () => {
    const client = makeClient();
    expect(pickMostRecentlyActiveClient([client])).toBe(client);
  });

  it("returns the client with the most recent last_activity_at", () => {
    const older = makeClient({ id: "older", last_activity_at: "2026-01-01T00:00:00.000Z" });
    const newer = makeClient({ id: "newer", last_activity_at: "2026-06-01T00:00:00.000Z" });
    expect(pickMostRecentlyActiveClient([older, newer])?.id).toBe("newer");
  });

  it("falls back to the first client when no client has last_activity_at", () => {
    const first = makeClient({ id: "first", last_activity_at: null });
    const second = makeClient({ id: "second", last_activity_at: null });
    expect(pickMostRecentlyActiveClient([first, second])?.id).toBe("first");
  });

  it("treats a client with last_activity_at as more recent than one without", () => {
    const noActivity = makeClient({ id: "no-activity", last_activity_at: null });
    const withActivity = makeClient({ id: "with-activity", last_activity_at: "2026-01-01T00:00:00.000Z" });
    expect(pickMostRecentlyActiveClient([noActivity, withActivity])?.id).toBe("with-activity");
  });
});
