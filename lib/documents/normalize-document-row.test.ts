import { describe, expect, it } from "vitest";
import { normalizeDocumentListRow, normalizeDocumentRow } from "@/lib/documents/normalize-document-row";

function baseRaw() {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    user_id: "22222222-2222-2222-2222-222222222222",
    client_id: null,
    project_id: null,
    type: "invoice",
    status: "draft",
    title: "Test Invoice",
    content_json: { type: "doc", content: [] },
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("normalizeDocumentRow — invoice fields", () => {
  it("defaults nullable invoice fields to null", () => {
    const result = normalizeDocumentRow(baseRaw());
    expect(result.invoice_number).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.payment_terms).toBeNull();
    expect(result.notes_footer).toBeNull();
    expect(result.paid_at).toBeNull();
    expect(result.pay_token).toBeNull();
  });

  it("defaults discount_value to 0 and discount_type to percent", () => {
    const result = normalizeDocumentRow(baseRaw());
    expect(result.discount_value).toBe(0);
    expect(result.discount_type).toBe("percent");
  });

  it("preserves provided invoice fields", () => {
    const result = normalizeDocumentRow({
      ...baseRaw(),
      invoice_number: "INV-0001",
      due_date: "2026-06-30",
      payment_terms: "Net 30",
      notes_footer: "Thanks!",
      paid_at: "2026-06-01T00:00:00Z",
      pay_token: "abc123",
      discount_value: 10,
      discount_type: "flat",
    });
    expect(result.invoice_number).toBe("INV-0001");
    expect(result.due_date).toBe("2026-06-30");
    expect(result.payment_terms).toBe("Net 30");
    expect(result.notes_footer).toBe("Thanks!");
    expect(result.paid_at).toBe("2026-06-01T00:00:00Z");
    expect(result.pay_token).toBe("abc123");
    expect(result.discount_value).toBe(10);
    expect(result.discount_type).toBe("flat");
  });
});

describe("normalizeDocumentRow — quote fields", () => {
  it("defaults nullable quote fields to null", () => {
    const result = normalizeDocumentRow({ ...baseRaw(), type: "quote" });
    expect(result.quote_number).toBeNull();
    expect(result.valid_until).toBeNull();
    expect(result.approval_token).toBeNull();
    expect(result.approved_at).toBeNull();
    expect(result.declined_at).toBeNull();
    expect(result.approval_message).toBeNull();
  });

  it("preserves provided quote fields", () => {
    const result = normalizeDocumentRow({
      ...baseRaw(),
      type: "quote",
      status: "approved",
      quote_number: "QUO-0001",
      valid_until: "2026-07-31",
      approval_token: "tok_abc",
      approved_at: "2026-06-15T10:00:00Z",
      declined_at: null,
      approval_message: "Looks good!",
    });
    expect(result.quote_number).toBe("QUO-0001");
    expect(result.valid_until).toBe("2026-07-31");
    expect(result.approval_token).toBe("tok_abc");
    expect(result.approved_at).toBe("2026-06-15T10:00:00Z");
    expect(result.declined_at).toBeNull();
    expect(result.approval_message).toBe("Looks good!");
    expect(result.status).toBe("approved");
  });

  it("preserves declined status and declined_at", () => {
    const result = normalizeDocumentRow({
      ...baseRaw(),
      type: "quote",
      status: "declined",
      declined_at: "2026-06-20T08:00:00Z",
      approval_message: "Budget too high.",
    });
    expect(result.status).toBe("declined");
    expect(result.declined_at).toBe("2026-06-20T08:00:00Z");
    expect(result.approval_message).toBe("Budget too high.");
  });
});

describe("normalizeDocumentRow — content_json coercion", () => {
  it("falls back to empty doc when content_json is invalid", () => {
    const result = normalizeDocumentRow({
      ...baseRaw(),
      content_json: null,
    });
    expect(result.content_json).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });

  it("preserves valid content_json", () => {
    const content = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] };
    const result = normalizeDocumentRow({ ...baseRaw(), content_json: content });
    expect(result.content_json).toEqual(content);
  });
});

describe("normalizeDocumentListRow — total_amount", () => {
  it("includes document VAT, like the document itself", () => {
    const row = normalizeDocumentListRow({
      ...baseRaw(),
      type: "quote",
      tax_mode: "vat",
      tax_rate: "5.00",
      line_items: [{ quantity: 1, unit_price: 10000, tax_rate: 0 }],
    });
    expect(row.total_amount).toBe(10500);
  });

  it("includes line-item tax and applies the discount", () => {
    const row = normalizeDocumentListRow({
      ...baseRaw(),
      discount_value: 10,
      discount_type: "percent",
      line_items: [{ quantity: 1, unit_price: 1000, tax_rate: 5 }],
    });
    // 1000 − 10% = 900, + 5% = 945
    expect(row.total_amount).toBe(945);
  });

  it("is null without line items", () => {
    expect(normalizeDocumentListRow({ ...baseRaw(), line_items: [] }).total_amount).toBeNull();
  });
});
