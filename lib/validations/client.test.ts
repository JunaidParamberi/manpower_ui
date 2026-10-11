import { describe, expect, it } from "vitest";

import { CLIENT_LIMITS, parseClientCreateInput } from "@/lib/validations/client";

function validBase() {
  return {
    name: "Acme Corp",
    website: "",
    email: "",
    billing_email: "",
    phone: "",
    company: "",
    contact_name: "",
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
  };
}

describe("parseClientCreateInput", () => {
  it("accepts name-only payload", () => {
    const result = parseClientCreateInput(validBase());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Acme Corp");
      expect(result.data.contact_name).toBeNull();
      expect(result.data.email).toBeNull();
      expect(result.data.currency).toBeNull();
    }
  });

  it("normalizes email and trims strings", () => {
    const result = parseClientCreateInput({
      ...validBase(),
      name: "  Jane  ",
      email: "  hello@example.com  ",
      phone: " +1 ",
      company: " Co ",
      contact_name: "  Pat  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Jane");
      expect(result.data.email).toBe("hello@example.com");
      expect(result.data.phone).toBe("+1");
      expect(result.data.company).toBe("Co");
      expect(result.data.contact_name).toBe("Pat");
    }
  });

  it("rejects invalid email when non-empty", () => {
    const result = parseClientCreateInput({
      ...validBase(),
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("uppercases currency and accepts lowercase input", () => {
    const result = parseClientCreateInput({
      ...validBase(),
      currency: "usd",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("USD");
    }
  });

  it("rejects invalid currency code", () => {
    const result = parseClientCreateInput({
      ...validBase(),
      currency: "US",
    });
    expect(result.success).toBe(false);
  });

  it("normalizes CRM and billing fields", () => {
    const result = parseClientCreateInput({
      ...validBase(),
      website: " https://acme.example ",
      billing_email: " billing@acme.example ",
      tax_id: " TRN 100-200 ",
      payment_terms_days: "30",
      relationship_status: "lead",
      lead_source: " Referral ",
      preferred_contact_method: "whatsapp",
      timezone: " Asia/Dubai ",
      tags: "VIP, retainer, vip,  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.website).toBe("https://acme.example");
      expect(result.data.billing_email).toBe("billing@acme.example");
      expect(result.data.tax_id).toBe("TRN 100-200");
      expect(result.data.payment_terms_days).toBe(30);
      expect(result.data.relationship_status).toBe("lead");
      expect(result.data.lead_source).toBe("Referral");
      expect(result.data.preferred_contact_method).toBe("whatsapp");
      expect(result.data.timezone).toBe("Asia/Dubai");
      expect(result.data.tags).toEqual(["VIP", "retainer"]);
    }
  });

  it("defaults missing CRM select fields for backwards-compatible callers", () => {
    const result = parseClientCreateInput({
      name: "Legacy client",
      email: "",
      phone: "",
      company: "",
      contact_name: "",
      address: "",
      currency: "",
      notes: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.relationship_status).toBe("active");
      expect(result.data.preferred_contact_method).toBeNull();
      expect(result.data.tags).toEqual([]);
    }
  });

  it("rejects invalid CRM enum and numeric values", () => {
    const result = parseClientCreateInput({
      ...validBase(),
      relationship_status: "cold",
      preferred_contact_method: "pager",
      payment_terms_days: "400",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >;
      expect(fieldErrors.relationship_status?.[0]).toBe("Invalid client status.");
      expect(fieldErrors.preferred_contact_method?.[0]).toBe(
        "Invalid preferred contact method.",
      );
      expect(fieldErrors.payment_terms_days?.[0]).toBe(
        "Payment terms must be between 0 and 365 days.",
      );
    }
  });

  it("rejects invalid billing email when non-empty", () => {
    const result = parseClientCreateInput({
      ...validBase(),
      billing_email: "billing-at-acme",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >;
      expect(fieldErrors.billing_email?.[0]).toBe("Invalid billing email.");
    }
  });

  it("maps empty optional fields to null", () => {
    const result = parseClientCreateInput(validBase());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeNull();
      expect(result.data.contact_name).toBeNull();
      expect(result.data.website).toBeNull();
      expect(result.data.billing_email).toBeNull();
      expect(result.data.tax_id).toBeNull();
      expect(result.data.payment_terms_days).toBeNull();
      expect(result.data.lead_source).toBeNull();
      expect(result.data.preferred_contact_method).toBeNull();
      expect(result.data.timezone).toBeNull();
      expect(result.data.tags).toEqual([]);
      expect(result.data.notes).toBeNull();
    }
  });

  it("rejects contact_name over max length", () => {
    const result = parseClientCreateInput({
      ...validBase(),
      contact_name: "x".repeat(CLIENT_LIMITS.contact_name + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over max length", () => {
    const result = parseClientCreateInput({
      ...validBase(),
      name: "x".repeat(CLIENT_LIMITS.name + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = parseClientCreateInput({
      ...validBase(),
      name: "   ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      const nameIssue = fieldErrors.name?.[0];
      expect(nameIssue).toBe("Display name is required.");
    }
  });
});
