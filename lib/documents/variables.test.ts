import { describe, it, expect } from "vitest";
import {
  isKnownVariable,
  substituteVariables,
  substituteInTiptapDoc,
  emptyVariableContext,
  VARIABLE_CATALOG,
  type VariableContext,
} from "./variables";
import type { TiptapDoc } from "@/types";

const FIXED_DATE = new Date("2026-01-15T12:00:00.000Z");

function makeCtx(overrides: Partial<VariableContext> = {}): VariableContext {
  return {
    client: {
      name: "Acme Corp",
      contact_name: "Jane Doe",
      email: "jane@acme.com",
      billing_email: "billing@acme.com",
      company: "Acme Corp",
      phone: null,
      address: null,
      website: "https://acme.example",
      tax_id: "TRN 100-200",
      payment_terms_days: "30",
    },
    project: { title: "Website Redesign" },
    brand: {
      business_name: "My Studio",
      primary_color: "#1a1a1a",
      email_signature: "Best regards",
      logo_url: null,
    },
    sender: null,
    now: FIXED_DATE,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isKnownVariable
// ---------------------------------------------------------------------------
describe("isKnownVariable", () => {
  it("returns true for every key in the catalog", () => {
    for (const v of VARIABLE_CATALOG) {
      expect(isKnownVariable(v.key)).toBe(true);
    }
  });

  it("returns false for unknown keys", () => {
    expect(isKnownVariable("nonexistent")).toBe(false);
    expect(isKnownVariable("")).toBe(false);
    expect(isKnownVariable("CLIENT_NAME")).toBe(false); // case-sensitive
  });
});

// ---------------------------------------------------------------------------
// substituteVariables
// ---------------------------------------------------------------------------
describe("substituteVariables", () => {
  it("substitutes a known variable", () => {
    const result = substituteVariables("Hello {{client_name}}", makeCtx());
    expect(result).toBe("Hello Acme Corp");
  });

  it("substitutes multiple variables in one string", () => {
    const result = substituteVariables(
      "{{brand_business_name}} — {{project_title}}",
      makeCtx(),
    );
    expect(result).toBe("My Studio — Website Redesign");
  });

  it("leaves unknown variable verbatim", () => {
    const result = substituteVariables("Hi {{unknown_key}} there", makeCtx());
    expect(result).toBe("Hi {{unknown_key}} there");
  });

  it("leaves known variable verbatim when value is null", () => {
    const ctx = makeCtx({ client: null });
    const result = substituteVariables("To {{client_name}}", ctx);
    expect(result).toBe("To {{client_name}}");
  });

  it("handles whitespace inside mustache braces", () => {
    const result = substituteVariables("{{ client_name }}", makeCtx());
    expect(result).toBe("Acme Corp");
  });

  it("formats {{today}} as a readable date string", () => {
    const result = substituteVariables("Date: {{today}}", makeCtx());
    // en-US locale: "January 15, 2026"
    expect(result).toContain("2026");
    expect(result).toContain("15");
  });

  it("uses contact_name when set for client_contact_name", () => {
    const result = substituteVariables("Attn: {{client_contact_name}}", makeCtx());
    expect(result).toBe("Attn: Jane Doe");
  });

  it("substitutes richer CRM client variables", () => {
    const result = substituteVariables(
      "{{client_billing_email}} · {{client_website}} · {{client_tax_id}} · {{client_payment_terms_days}} days",
      makeCtx(),
    );
    expect(result).toBe(
      "billing@acme.com · https://acme.example · TRN 100-200 · 30 days",
    );
  });

  it("falls back to client name when contact_name is null", () => {
    const ctx = makeCtx({
      client: {
        name: "Acme Corp",
        contact_name: null,
        email: null,
        company: null,
        phone: null,
        address: null,
      },
    });
    const result = substituteVariables("Attn: {{client_contact_name}}", ctx);
    expect(result).toBe("Attn: Acme Corp");
  });

  it("returns plain text unchanged when no variables present", () => {
    expect(substituteVariables("No vars here", makeCtx())).toBe("No vars here");
  });
});

// ---------------------------------------------------------------------------
// substituteInTiptapDoc
// ---------------------------------------------------------------------------
describe("substituteInTiptapDoc", () => {
  it("substitutes variables in text nodes", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello {{client_name}}" }],
        },
      ],
    };
    const result = substituteInTiptapDoc(doc, makeCtx());
    const textNode = result.content?.[0]?.content?.[0];
    expect(textNode?.text).toBe("Hello Acme Corp");
  });

  it("does not mutate the original doc", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "{{client_name}}" }] },
      ],
    };
    substituteInTiptapDoc(doc, makeCtx());
    expect(doc.content?.[0]?.content?.[0]?.text).toBe("{{client_name}}");
  });

  it("handles a doc with no content array", () => {
    const doc: TiptapDoc = { type: "doc" };
    const result = substituteInTiptapDoc(doc, makeCtx());
    expect(result).toEqual({ type: "doc" });
  });

  it("walks nested nodes", () => {
    const doc: TiptapDoc = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "{{project_title}}" }] },
              ],
            },
          ],
        },
      ],
    };
    const result = substituteInTiptapDoc(doc, makeCtx());
    const leaf = result.content?.[0]?.content?.[0]?.content?.[0]?.content?.[0];
    expect(leaf?.text).toBe("Website Redesign");
  });
});

// ---------------------------------------------------------------------------
// emptyVariableContext
// ---------------------------------------------------------------------------
describe("emptyVariableContext", () => {
  it("returns null for all optional fields", () => {
    const ctx = emptyVariableContext();
    expect(ctx.client).toBeNull();
    expect(ctx.project).toBeNull();
    expect(ctx.brand).toBeNull();
    expect(ctx.sender).toBeNull();
  });

  it("now is a Date instance", () => {
    expect(emptyVariableContext().now).toBeInstanceOf(Date);
  });

  it("returns a fresh object each call (no shared state)", () => {
    const a = emptyVariableContext();
    const b = emptyVariableContext();
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// VariableContext sender — gstin / vat_reg_no fields
// ---------------------------------------------------------------------------
describe("VariableContext sender compliance fields", () => {
  function makeSender(overrides: Partial<NonNullable<VariableContext["sender"]>> = {}): NonNullable<VariableContext["sender"]> {
    return {
      name: "Jane Doe",
      company_name: "Acme Studio",
      email: "jane@acme.example",
      address_line1: null,
      address_line2: null,
      city: null,
      region: null,
      postal_code: null,
      country: null,
      vat_number: null,
      gstin: null,
      vat_reg_no: null,
      ...overrides,
    };
  }

  it("accepts gstin in sender context", () => {
    const ctx = makeCtx({ sender: makeSender({ gstin: "29ABCDE1234F1Z5" }) });
    expect(ctx.sender?.gstin).toBe("29ABCDE1234F1Z5");
  });

  it("accepts vat_reg_no in sender context", () => {
    const ctx = makeCtx({ sender: makeSender({ vat_reg_no: "GB123456789" }) });
    expect(ctx.sender?.vat_reg_no).toBe("GB123456789");
  });

  it("allows both gstin and vat_number independently", () => {
    const ctx = makeCtx({
      sender: makeSender({ gstin: "29ABCDE1234F1Z5", vat_number: null }),
    });
    expect(ctx.sender?.gstin).toBe("29ABCDE1234F1Z5");
    expect(ctx.sender?.vat_number).toBeNull();
  });

  it("defaults gstin and vat_reg_no to null when not set", () => {
    const ctx = makeCtx({ sender: makeSender() });
    expect(ctx.sender?.gstin).toBeNull();
    expect(ctx.sender?.vat_reg_no).toBeNull();
  });
});
