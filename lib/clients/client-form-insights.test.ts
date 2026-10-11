import { describe, expect, it } from "vitest";

import type { ClientCreateFormInput } from "@/lib/validations/client";
import { buildClientFormInsights } from "./client-form-insights";

function clientValues(
  overrides: Partial<ClientCreateFormInput> = {},
): ClientCreateFormInput {
  return {
    name: "",
    contact_name: "",
    website: "",
    email: "",
    billing_email: "",
    phone: "",
    company: "",
    address: "",
    currency: "",
    tax_id: "",
    payment_terms_days: "",
    relationship_status: "active",
    lead_source: "",
    preferred_contact_method: "",
    timezone: "",
    tags: "",
    notes: "",
    ...overrides,
  };
}

describe("buildClientFormInsights", () => {
  it("summarizes a company client with billing context", () => {
    const insights = buildClientFormInsights(
      clientValues({
        name: "Atlas Creative",
        contact_name: "Richard Hammond",
        email: "james@atlascreative.co.uk",
        billing_email: "accounts@atlascreative.co.uk",
        phone: "+44 20 7946 0854",
        currency: "GBP",
        payment_terms_days: "30",
        relationship_status: "active",
        preferred_contact_method: "email",
        tags: "retainer, VIP",
      }),
    );

    expect(insights.displayName).toBe("Atlas Creative");
    expect(insights.relationshipLabel).toBe("Active client");
    expect(insights.primaryContactLabel).toBe("Richard Hammond");
    expect(insights.billingRouteLabel).toBe("accounts@atlascreative.co.uk");
    expect(insights.paymentTermsLabel).toBe("30 days");
    expect(insights.tags).toEqual(["retainer", "VIP"]);
    expect(insights.missingEssentials).toEqual([]);
    expect(insights.completionPercent).toBe(100);
  });

  it("falls back to guidance for an incomplete draft", () => {
    const insights = buildClientFormInsights(clientValues());

    expect(insights.displayName).toBe("Untitled client");
    expect(insights.primaryContactLabel).toBe("No contact route yet");
    expect(insights.billingRouteLabel).toBe("Uses primary email unless added");
    expect(insights.missingEssentials).toEqual([
      "Add a display name",
      "Add an email or phone",
    ]);
    expect(insights.completedCount).toBe(1);
    expect(insights.totalCount).toBe(3);
    expect(insights.completionPercent).toBe(33);
  });
});
