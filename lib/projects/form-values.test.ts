import { describe, expect, it } from "vitest";

import { projectCreateDefaultsForClient } from "./form-values";
import type { ClientRow } from "@/types";

const CLIENTS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "user-1",
    name: "Acme",
    contact_name: null,
    website: null,
    email: null,
    billing_email: null,
    phone: null,
    company: null,
    address: null,
    currency: "USD",
    tax_id: null,
    payment_terms_days: null,
    relationship_status: "active",
    lead_source: null,
    preferred_contact_method: null,
    timezone: null,
    tags: [],
    notes: null,
    health_score: null,
    portal_token: null,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    user_id: "user-1",
    name: "Northwind",
    contact_name: null,
    website: null,
    email: null,
    billing_email: null,
    phone: null,
    company: null,
    address: null,
    currency: "USD",
    tax_id: null,
    payment_terms_days: null,
    relationship_status: "active",
    lead_source: null,
    preferred_contact_method: null,
    timezone: null,
    tags: [],
    notes: null,
    health_score: null,
    portal_token: null,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
  },
] satisfies ClientRow[];

describe("projectCreateDefaultsForClient", () => {
  it("uses the requested client when it belongs to the loaded client list", () => {
    expect(
      projectCreateDefaultsForClient({
        clients: CLIENTS,
        requestedClientId: CLIENTS[1].id,
      }).client_id,
    ).toBe(CLIENTS[1].id);
  });

  it("falls back to the first loaded client when the requested client is invalid", () => {
    expect(
      projectCreateDefaultsForClient({
        clients: CLIENTS,
        requestedClientId: "99999999-9999-4999-8999-999999999999",
      }).client_id,
    ).toBe(CLIENTS[0].id);
  });
});
