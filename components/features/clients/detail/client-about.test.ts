import { describe, expect, it } from "vitest";

import type { ClientRow } from "@/types";
import { clientAboutRows } from "./client-about";

const client: ClientRow = {
  id: "c1", user_id: "u1", name: "Al Noor Interiors", contact_name: "Mariam", website: null,
  email: "mariam@alnoor.ae", billing_email: "  ", phone: null, company: null, address: null,
  currency: "AED", tax_id: null, payment_terms_days: 0, relationship_status: "active", lead_source: null,
  preferred_contact_method: null, timezone: "Not/AZone", tags: [], notes: null, health_score: null,
  portal_token: null, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
};

describe("clientAboutRows", () => {
  it("drops empty and blank fields, keeps zero payment terms", () => {
    expect(clientAboutRows(client)).toEqual([
      ["Contact", "Mariam"],
      ["Email", "mariam@alnoor.ae"],
      ["Timezone", "Not/AZone"],
      ["Payment terms", "0 days"],
    ]);
  });
  it("adds local time for a valid timezone", () => {
    const rows = clientAboutRows({ ...client, timezone: "Asia/Dubai" }, new Date("2026-10-09T10:02:00Z"));
    expect(rows.find(([k]) => k === "Timezone")?.[1]).toBe("Asia/Dubai · 14:02");
  });
});
