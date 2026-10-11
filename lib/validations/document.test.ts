import { describe, expect, it } from "vitest";

import {
  DOCUMENT_LIMITS,
  emptyTiptapDoc,
  invoiceMetaSchema,
  parseDocumentPropertiesInput,
  parseDocumentInput,
  parseTemplateInput,
  proposalMetaSchema,
  quoteMetaSchema,
} from "@/lib/validations/document";

const CLIENT_ID = "11111111-1111-4111-8111-111111111111";

function validDocBase() {
  return {
    title: "New proposal",
    type: "proposal" as const,
    client_id: CLIENT_ID,
    content_json: emptyTiptapDoc(),
  };
}

describe("parseDocumentInput", () => {
  it("accepts the minimum required payload", () => {
    const result = parseDocumentInput(validDocBase());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("New proposal");
      expect(result.data.type).toBe("proposal");
      expect(result.data.status).toBe("draft");
      expect(result.data.client_id).toBe(CLIENT_ID);
      expect(result.data.project_id).toBeNull();
    }
  });

  it("trims the title", () => {
    const result = parseDocumentInput({
      ...validDocBase(),
      title: "   Padded title   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Padded title");
    }
  });

  it("accepts a blank title — the document is then named automatically", () => {
    const result = parseDocumentInput({ ...validDocBase(), title: "   " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("");
  });

  it("treats a missing title as blank", () => {
    const { title: _omit, ...rest } = validDocBase();
    void _omit;
    const result = parseDocumentInput(rest);
    expect(result.success && result.data.title).toBe("");
  });

  it("rejects a title over the max length", () => {
    const result = parseDocumentInput({
      ...validDocBase(),
      title: "x".repeat(DOCUMENT_LIMITS.title + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown document type", () => {
    const result = parseDocumentInput({
      ...validDocBase(),
      type: "blog-post",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-doc content_json root", () => {
    const result = parseDocumentInput({
      ...validDocBase(),
      content_json: { type: "paragraph", content: [] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing client_id", () => {
    const payload: Record<string, unknown> = { ...validDocBase() };
    delete payload.client_id;
    const result = parseDocumentInput(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.client_id).toBeNull();
    }
  });

  it("maps an empty client_id to null", () => {
    const result = parseDocumentInput({
      ...validDocBase(),
      client_id: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.client_id).toBeNull();
    }
  });

  it("maps an empty project_id string to null", () => {
    const result = parseDocumentInput({
      ...validDocBase(),
      project_id: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.client_id).toBe(CLIENT_ID);
      expect(result.data.project_id).toBeNull();
    }
  });

  it("preserves a valid client_id uuid", () => {
    const result = parseDocumentInput({
      ...validDocBase(),
      client_id: CLIENT_ID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.client_id).toBe(CLIENT_ID);
    }
  });

  it("rejects a malformed client_id", () => {
    const result = parseDocumentInput({
      ...validDocBase(),
      client_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("honors a custom status when provided", () => {
    const result = parseDocumentInput({
      ...validDocBase(),
      status: "sent",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("sent");
    }
  });

  it("accepts approved and declined statuses", () => {
    for (const status of ["approved", "declined"] as const) {
      const result = parseDocumentInput({ ...validDocBase(), status });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.status).toBe(status);
    }
  });

  it("accepts quote as document type", () => {
    const result = parseDocumentInput({ ...validDocBase(), type: "quote" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.type).toBe("quote");
  });
});

describe("parseDocumentPropertiesInput", () => {
  it("accepts document properties without status", () => {
    const result = parseDocumentPropertiesInput({
      ...validDocBase(),
      type: "invoice",
      project_id: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("New proposal");
      expect(result.data.type).toBe("invoice");
      expect(result.data.client_id).toBe(CLIENT_ID);
      expect(result.data.project_id).toBeNull();
      expect(result.data.content_json).toEqual(emptyTiptapDoc());
      expect("status" in result.data).toBe(false);
    }
  });

  it("rejects status so property saves cannot overwrite settlement state", () => {
    const result = parseDocumentPropertiesInput({
      ...validDocBase(),
      status: "draft",
    });

    expect(result.success).toBe(false);
  });
});

function validTemplateBase() {
  return {
    name: "Discovery proposal",
    type: "proposal" as const,
    content_json: emptyTiptapDoc(),
  };
}

describe("parseTemplateInput", () => {
  it("accepts the minimum required payload", () => {
    const result = parseTemplateInput(validTemplateBase());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Discovery proposal");
      expect(result.data.description).toBeNull();
    }
  });

  it("trims name and description", () => {
    const result = parseTemplateInput({
      ...validTemplateBase(),
      name: "  Padded  ",
      description: "  Notes  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Padded");
      expect(result.data.description).toBe("Notes");
    }
  });

  it("rejects an empty name", () => {
    const result = parseTemplateInput({ ...validTemplateBase(), name: " " });
    expect(result.success).toBe(false);
  });

  it("rejects an oversized name", () => {
    const result = parseTemplateInput({
      ...validTemplateBase(),
      name: "x".repeat(DOCUMENT_LIMITS.template_name + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an oversized description", () => {
    const result = parseTemplateInput({
      ...validTemplateBase(),
      description: "x".repeat(DOCUMENT_LIMITS.template_description + 1),
    });
    expect(result.success).toBe(false);
  });
});

describe("quoteMetaSchema", () => {
  it("accepts empty object — all fields optional", () => {
    const result = quoteMetaSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts full valid payload", () => {
    const result = quoteMetaSchema.safeParse({
      quote_number: "QUO-0001",
      valid_until: "2026-12-31",
      notes_footer: "Valid for 30 days.",
      discount_value: 10,
      discount_type: "percent",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quote_number).toBe("QUO-0001");
      expect(result.data.valid_until).toBe("2026-12-31");
      expect(result.data.discount_type).toBe("percent");
    }
  });

  it("accepts flat discount type", () => {
    const result = quoteMetaSchema.safeParse({ discount_type: "flat", discount_value: 50 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.discount_type).toBe("flat");
  });

  it("rejects invalid discount_type", () => {
    const result = quoteMetaSchema.safeParse({ discount_type: "fixed" });
    expect(result.success).toBe(false);
  });

  it("rejects negative discount_value", () => {
    const result = quoteMetaSchema.safeParse({ discount_value: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects malformed valid_until date", () => {
    const result = quoteMetaSchema.safeParse({ valid_until: "31-12-2026" });
    expect(result.success).toBe(false);
  });

  it("accepts valid_until as null", () => {
    const result = quoteMetaSchema.safeParse({ valid_until: null });
    expect(result.success).toBe(true);
  });

  it("rejects oversized quote_number", () => {
    const result = quoteMetaSchema.safeParse({ quote_number: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects oversized notes_footer", () => {
    const result = quoteMetaSchema.safeParse({ notes_footer: "x".repeat(1001) });
    expect(result.success).toBe(false);
  });

  it("coerces discount_value from string", () => {
    const result = quoteMetaSchema.safeParse({ discount_value: "15" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.discount_value).toBe(15);
  });

  it("defaults discount_value to 0 when not provided", () => {
    const result = quoteMetaSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.discount_value).toBe(0);
  });

  it("defaults discount_type to percent when not provided", () => {
    const result = quoteMetaSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.discount_type).toBe("percent");
  });
});

describe("invoiceMetaSchema", () => {
  it("accepts empty object — all fields optional", () => {
    const result = invoiceMetaSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts full valid payload", () => {
    const result = invoiceMetaSchema.safeParse({
      invoice_number: "INV-0042",
      due_date: "2026-06-30",
      payment_terms: "Net 30",
      notes_footer: "Thank you!",
      discount_value: 5,
      discount_type: "percent",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.invoice_number).toBe("INV-0042");
      expect(result.data.due_date).toBe("2026-06-30");
      expect(result.data.payment_terms).toBe("Net 30");
    }
  });

  it("rejects malformed due_date", () => {
    const result = invoiceMetaSchema.safeParse({ due_date: "June 30 2026" });
    expect(result.success).toBe(false);
  });

  it("rejects negative discount_value", () => {
    const result = invoiceMetaSchema.safeParse({ discount_value: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects oversized invoice_number", () => {
    const result = invoiceMetaSchema.safeParse({ invoice_number: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejects oversized payment_terms", () => {
    const result = invoiceMetaSchema.safeParse({ payment_terms: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("accepts due_date as null", () => {
    const result = invoiceMetaSchema.safeParse({ due_date: null });
    expect(result.success).toBe(true);
  });

  it("defaults discount_value to 0 and discount_type to percent", () => {
    const result = invoiceMetaSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.discount_value).toBe(0);
      expect(result.data.discount_type).toBe("percent");
    }
  });
});

describe("proposalMetaSchema", () => {
  it("accepts all optional fields absent", () => {
    const result = proposalMetaSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data?.discount_value).toBe(0);
    expect(result.data?.discount_type).toBe("percent");
  });

  it("accepts valid proposal_number", () => {
    const result = proposalMetaSchema.safeParse({ proposal_number: "PRO-0001" });
    expect(result.success).toBe(true);
    expect(result.data?.proposal_number).toBe("PRO-0001");
  });

  it("rejects proposal_number over 100 chars", () => {
    const result = proposalMetaSchema.safeParse({ proposal_number: "P".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts valid date for valid_until", () => {
    const result = proposalMetaSchema.safeParse({ valid_until: "2026-12-31" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid date format", () => {
    const result = proposalMetaSchema.safeParse({ valid_until: "31-12-2026" });
    expect(result.success).toBe(false);
  });

  it("accepts discount_type flat", () => {
    const result = proposalMetaSchema.safeParse({ discount_type: "flat", discount_value: 500 });
    expect(result.success).toBe(true);
    expect(result.data?.discount_type).toBe("flat");
  });

  it("rejects invalid discount_type", () => {
    const result = proposalMetaSchema.safeParse({ discount_type: "unknown" });
    expect(result.success).toBe(false);
  });

  it("coerces discount_value from string", () => {
    const result = proposalMetaSchema.safeParse({ discount_value: "10.5" });
    expect(result.success).toBe(true);
    expect(result.data?.discount_value).toBe(10.5);
  });

  it("rejects negative discount_value", () => {
    const result = proposalMetaSchema.safeParse({ discount_value: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts null for all nullable fields", () => {
    const result = proposalMetaSchema.safeParse({
      proposal_number: null,
      valid_until: null,
      notes_footer: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts full proposal_content with all sections", () => {
    const result = proposalMetaSchema.safeParse({
      proposal_number: "PRO-0001",
      proposal_content: {
        headline: "Website Redesign",
        headline_accent: "Redesign",
        subhead: "A modern refresh for Acme Corp",
        investment_range: "$12,000 – $18,000",
        opportunity: "Your current site undersells the brand.",
        opportunity_detail: "We have a six-week window to ship before Q4.",
        deliverables: [
          { num: "01", name: "Visual direction", description: "Two routes, hero comp", hours: 24 },
        ],
        timeline: [
          { name: "Direction", start_week: 1, span_weeks: 2, color: "accent" },
        ],
        timeline_weeks: 8,
        milestones: ["Kickoff · 23 June", "Launch · 16 September"],
        next_step_text: "Sign below to kick off the project.",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts proposal_content with only some sections", () => {
    const result = proposalMetaSchema.safeParse({
      proposal_content: {
        headline: "Quick Proposal",
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts null proposal_content", () => {
    const result = proposalMetaSchema.safeParse({
      proposal_content: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects deliverable with missing num field", () => {
    const result = proposalMetaSchema.safeParse({
      proposal_content: {
        deliverables: [{ name: "Design" }],
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects timeline entry with missing start_week", () => {
    const result = proposalMetaSchema.safeParse({
      proposal_content: {
        timeline: [{ name: "Build", span_weeks: 3 }],
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("meta schemas carry tax fields", () => {
  it("invoice meta accepts tax_mode + tax_rate", () => {
    const r = invoiceMetaSchema.parse({ tax_mode: "vat", tax_rate: 5 });
    expect(r.tax_mode).toBe("vat");
    expect(r.tax_rate).toBe(5);
  });

  it("quote meta defaults tax to none/0", () => {
    const r = quoteMetaSchema.parse({});
    expect(r.tax_mode).toBe("none");
    expect(r.tax_rate).toBe(0);
  });
});

describe("meta schemas carry currency fields", () => {
  it("invoice meta validates currency + fx_rate", () => {
    const r = invoiceMetaSchema.parse({ currency: "AED", fx_rate: 3.6725 });
    expect(r.currency).toBe("AED");
    expect(r.fx_rate).toBe(3.6725);
  });

  it("invoice meta rejects invalid currency code format", () => {
    expect(() => invoiceMetaSchema.parse({ currency: "aed" })).toThrow();
    expect(() => invoiceMetaSchema.parse({ currency: "AEDD" })).toThrow();
    expect(() => invoiceMetaSchema.parse({ currency: "123" })).toThrow();
  });

  it("invoice meta rejects negative or zero fx_rate", () => {
    expect(() => invoiceMetaSchema.parse({ fx_rate: -1 })).toThrow();
    expect(() => invoiceMetaSchema.parse({ fx_rate: 0 })).toThrow();
  });

  it("quote meta validates currency + fx_rate", () => {
    const r = quoteMetaSchema.parse({ currency: "GBP", fx_rate: 1.25 });
    expect(r.currency).toBe("GBP");
    expect(r.fx_rate).toBe(1.25);
  });
});
