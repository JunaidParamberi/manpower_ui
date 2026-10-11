import { describe, expect, it } from "vitest";

import {
  defaultDocumentFormValues,
  documentInputFromTemplateSelection,
  documentToFormValues,
} from "./form-values";
import type { DocumentRow, DocumentTemplateRow, TiptapDoc } from "@/types";

const TEMPLATE = {
  id: "11111111-1111-4111-8111-111111111111",
  user_id: null,
  name: "Standard quote",
  description: null,
  type: "quote",
  content_json: {
    type: "doc",
    content: [{ type: "paragraph" }],
  },
  is_system: true,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
} satisfies DocumentTemplateRow;

describe("documentInputFromTemplateSelection", () => {
  it("preserves requested client and type when starting from a blank document", () => {
    expect(
      documentInputFromTemplateSelection({
        template: null,
        requestedType: "invoice",
        requestedClientId: "22222222-2222-4222-8222-222222222222",
      }),
    ).toMatchObject({
      title: "", // blank → named automatically on create
      type: "invoice",
      status: "draft",
      client_id: "22222222-2222-4222-8222-222222222222",
      project_id: "",
    });
  });

  it("uses requested type over template type for client shortcut flows", () => {
    expect(
      documentInputFromTemplateSelection({
        template: TEMPLATE,
        requestedType: "invoice",
        requestedClientId: "22222222-2222-4222-8222-222222222222",
      }),
    ).toMatchObject({
      // The template's name isn't the document's name — it's named automatically.
      title: "",
      type: "invoice",
      client_id: "22222222-2222-4222-8222-222222222222",
    });
  });
});

const EMPTY_DOC: TiptapDoc = { type: "doc", content: [{ type: "paragraph" }] };

function makeTemplateRow(overrides: Partial<DocumentTemplateRow> = {}): DocumentTemplateRow {
  return {
    id: "tmpl-1",
    user_id: "user-1",
    type: "invoice",
    name: "My Invoice Template",
    description: null,
    content_json: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Template content" }] }] },
    is_system: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeDocumentRow(overrides: Partial<DocumentRow> = {}): DocumentRow {
  return {
    id: "doc-1",
    user_id: "user-1",
    client_id: "client-1",
    project_id: "project-1",
    type: "invoice",
    status: "sent",
    title: "Invoice #001",
    content_json: EMPTY_DOC,
    pdf_url: null,
    sent_at: null,
    viewed_at: null,
    signed_at: null,
    invoice_number: "INV-0001",
    due_date: "2026-02-01",
    payment_terms: null,
    notes_footer: null,
    paid_at: null,
    pay_token: null,
    discount_value: 0,
    discount_type: "percent",
    quote_number: null,
    proposal_number: null,
    valid_until: null,
    approval_token: null,
    approved_at: null,
    declined_at: null,
    approval_message: null,
    approval_recipient_email: null,
    approval_otp: null,
    approval_otp_expires_at: null,
    approved_by_email: null,
    receipt_number: null,
    source_document_id: null,
    payment_id: null,
    lpo_number: null,
    lpo_validity_date: null,
    lpo_amount: null,
    lpo_pdf_url: null,
    lpo_reference_number: null,
    proposal_content: null,
    currency: "USD",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    issued_at: "2026-01-01T00:00:00.000Z",
    deleted_at: null,
    internal_notes: null,
    void_reason: null,
    tax_mode: "none" as const,
    tax_rate: 0,
    fx_rate: null,
    tds_enabled: false,
    tds_rate: 0,
    tds_certificate_url: null,
    recurring_invoice_id: null,
    title_is_auto: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// defaultDocumentFormValues
// ---------------------------------------------------------------------------
describe("defaultDocumentFormValues", () => {
  it("returns empty defaults with no args", () => {
    const result = defaultDocumentFormValues();
    expect(result.title).toBe("");
    expect(result.type).toBe("other");
    expect(result.status).toBe("draft");
    expect(result.client_id).toBe("");
    expect(result.project_id).toBe("");
    expect((result.content_json as TiptapDoc).type).toBe("doc");
  });

  it("applies type override", () => {
    const result = defaultDocumentFormValues({ type: "quote" });
    expect(result.type).toBe("quote");
  });

  it("seeds content from template and leaves the title for automatic naming", () => {
    const template = makeTemplateRow();
    const result = defaultDocumentFormValues({ template });
    expect(result.title).toBe("");
    expect(result.type).toBe("invoice");
    expect(result.content_json).toEqual(template.content_json);
  });

  it("type arg wins over template type", () => {
    const template = makeTemplateRow({ type: "invoice" });
    const result = defaultDocumentFormValues({ type: "quote", template });
    expect(result.type).toBe("quote");
  });

  it("prefills client_id and project_id", () => {
    const result = defaultDocumentFormValues({
      client_id: "client-abc",
      project_id: "project-xyz",
    });
    expect(result.client_id).toBe("client-abc");
    expect(result.project_id).toBe("project-xyz");
  });

  it("null client_id becomes empty string", () => {
    const result = defaultDocumentFormValues({ client_id: null });
    expect(result.client_id).toBe("");
  });

  it("status is always draft", () => {
    const result = defaultDocumentFormValues({ type: "invoice" });
    expect(result.status).toBe("draft");
  });
});

// ---------------------------------------------------------------------------
// documentToFormValues
// ---------------------------------------------------------------------------
describe("documentToFormValues", () => {
  it("maps all fields from a DocumentRow", () => {
    const doc = makeDocumentRow();
    const form = documentToFormValues(doc);
    expect(form.title).toBe("Invoice #001");
    expect(form.type).toBe("invoice");
    expect(form.status).toBe("sent");
    expect(form.client_id).toBe("client-1");
    expect(form.project_id).toBe("project-1");
    expect(form.content_json).toEqual(EMPTY_DOC);
  });

  it("converts null client_id to empty string", () => {
    const doc = makeDocumentRow({ client_id: null });
    expect(documentToFormValues(doc).client_id).toBe("");
  });

  it("converts null project_id to empty string", () => {
    const doc = makeDocumentRow({ project_id: null });
    expect(documentToFormValues(doc).project_id).toBe("");
  });

  it("preserves the document content_json reference", () => {
    const content: TiptapDoc = { type: "doc", content: [{ type: "paragraph" }] };
    const doc = makeDocumentRow({ content_json: content });
    expect(documentToFormValues(doc).content_json).toBe(content);
  });
});
