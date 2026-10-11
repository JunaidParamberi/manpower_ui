import { describe, expect, it } from "vitest";
import { buildClientSideContext } from "./variables-client";
import { emptyVariableContext } from "./variables";
import type { ClientRow, ProjectListRow } from "@/types";

const mockClient: ClientRow = {
  id: "c1",
  user_id: "u1",
  name: "Acme Corp",
  contact_name: "Alice",
  website: "https://acme.example",
  email: "alice@acme.com",
  billing_email: "billing@acme.com",
  company: "Acme",
  phone: null,
  address: null,
  currency: null,
  tax_id: null,
  payment_terms_days: null,
  relationship_status: "active",
  lead_source: null,
  preferred_contact_method: null,
  timezone: null,
  tags: [],
  portal_token: null,
  notes: null,
  health_score: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
};

const mockProject: ProjectListRow = {
  id: "p1",
  user_id: "u1",
  client_id: "c1",
  title: "Website Redesign",
  status: "active",
  budget: null,
  spent: null,
  hourly_rate: null,
  start_date: null,
  deadline: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  client: { id: "c1", name: "Acme Corp" },
};

describe("buildClientSideContext", () => {
  it("returns null client when no clientId", () => {
    const ctx = buildClientSideContext({
      clientId: undefined,
      projectId: undefined,
      clients: [mockClient],
      projects: [mockProject],
      initialCtx: emptyVariableContext(),
    });
    expect(ctx.client).toBeNull();
  });

  it("maps client fields when clientId matches", () => {
    const ctx = buildClientSideContext({
      clientId: "c1",
      projectId: undefined,
      clients: [mockClient],
      projects: [],
      initialCtx: emptyVariableContext(),
    });
    expect(ctx.client).toEqual({
      name: "Acme Corp",
      contact_name: "Alice",
      email: "alice@acme.com",
      billing_email: "billing@acme.com",
      company: "Acme",
      phone: null,
      address: null,
      website: "https://acme.example",
      tax_id: null,
      payment_terms_days: null,
    });
  });

  it("returns null client when clientId not found in list", () => {
    const ctx = buildClientSideContext({
      clientId: "unknown-id",
      projectId: undefined,
      clients: [mockClient],
      projects: [],
      initialCtx: emptyVariableContext(),
    });
    expect(ctx.client).toBeNull();
  });

  it("maps project title when projectId matches", () => {
    const ctx = buildClientSideContext({
      clientId: undefined,
      projectId: "p1",
      clients: [],
      projects: [mockProject],
      initialCtx: emptyVariableContext(),
    });
    expect(ctx.project).toEqual({ title: "Website Redesign" });
  });

  it("returns null project when projectId not found in list", () => {
    const ctx = buildClientSideContext({
      clientId: undefined,
      projectId: "unknown-id",
      clients: [],
      projects: [mockProject],
      initialCtx: emptyVariableContext(),
    });
    expect(ctx.project).toBeNull();
  });

  it("preserves brand from initialCtx", () => {
    const initialCtx = {
      ...emptyVariableContext(),
      brand: {
        business_name: "My Studio",
        primary_color: "#7c3aed",
        email_signature: "Thanks,\nJane",
        logo_url: null,
      },
    };
    const ctx = buildClientSideContext({
      clientId: undefined,
      projectId: undefined,
      clients: [],
      projects: [],
      initialCtx,
    });
    expect(ctx.brand).toEqual(initialCtx.brand);
  });
});
