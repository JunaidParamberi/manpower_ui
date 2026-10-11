import { beforeEach, describe, expect, it, vi } from "vitest";
import { lpoMetaSchema } from "@/lib/validations/document";
import { createClient } from "@/lib/supabase/server";
import { nextDocumentNumber } from "@/lib/documents/document-numbers";
import { getQuoteWithLineItems } from "@/lib/documents/quote-queries";
import { insertAuditEntry } from "@/lib/documents/lpo/audit-log";
import { createLpoDraftFromQuote } from "@/lib/documents/lpo-mutations";
import type { QuoteDocumentRow } from "@/types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/documents/document-numbers", () => ({
  nextDocumentNumber: vi.fn(),
}));

vi.mock("@/lib/documents/quote-queries", () => ({
  getQuoteWithLineItems: vi.fn(),
}));

vi.mock("@/lib/documents/lpo/audit-log", () => ({
  insertAuditEntry: vi.fn(),
}));

const USER_ID = "11111111-1111-4111-8111-111111111111";
const QUOTE_ID = "22222222-2222-4222-8222-222222222222";
const LPO_ID = "33333333-3333-4333-8333-333333333333";

function createQuote(): QuoteDocumentRow {
  return {
    id: QUOTE_ID,
    user_id: USER_ID,
    client_id: "44444444-4444-4444-8444-444444444444",
    project_id: "55555555-5555-4555-8555-555555555555",
    type: "quote",
    status: "approved",
    title: "Website redesign",
    title_is_auto: false,
    content_json: { type: "doc", content: [] },
    pdf_url: null,
    sent_at: null,
    viewed_at: null,
    signed_at: null,
    invoice_number: null,
    due_date: null,
    payment_terms: null,
    notes_footer: null,
    paid_at: null,
    pay_token: null,
    discount_value: 10,
    discount_type: "percent",
    quote_number: "Q-0418",
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
    currency: "AED",
    created_at: "2026-05-06T00:00:00Z",
    updated_at: "2026-05-06T00:00:00Z",
    issued_at: null,
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
    line_items: [
      {
        id: "line-1",
        document_id: QUOTE_ID,
        description: "Design system & component library",
        notes: null,
        quantity: 1,
        unit_price: 3200,
        tax_rate: 5,
        sort_order: 1,
        hsn_sac_code: null,
        created_at: "2026-05-06T00:00:00Z",
        updated_at: "2026-05-06T00:00:00Z",
      },
    ],
  };
}

function mockSupabase() {
  const documentsQuery = {
    insert: vi.fn(() => documentsQuery),
    select: vi.fn(() => documentsQuery),
    eq: vi.fn(() => documentsQuery),
    neq: vi.fn(() => documentsQuery),
    limit: vi.fn(() => documentsQuery),
    maybeSingle: vi.fn(async () => ({ data: null, error: null })), // no existing LPO
    single: vi.fn(async () => ({ data: { id: LPO_ID }, error: null })),
  };
  const lineItemsQuery = {
    insert: vi.fn(async () => ({ data: null, error: null })),
  };
  const supabase = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: USER_ID, email: "owner@manpower.ai" } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "documents") return documentsQuery;
      if (table === "line_items") return lineItemsQuery;
      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  vi.mocked(createClient).mockResolvedValue(supabase as never);

  return { documentsQuery, lineItemsQuery };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(nextDocumentNumber).mockResolvedValue("LPO-2026-004");
  vi.mocked(insertAuditEntry).mockResolvedValue(undefined);
});

describe("lpoMetaSchema", () => {
  it("accepts valid LPO metadata", () => {
    const result = lpoMetaSchema.safeParse({
      lpo_number: "LPO-2026-001",
      lpo_validity_date: "2026-12-31",
      lpo_amount: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty lpo_number", () => {
    const result = lpoMetaSchema.safeParse({
      lpo_number: "",
      lpo_validity_date: null,
      lpo_amount: null,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("LPO number is required.");
  });

  it("rejects negative lpo_amount", () => {
    const result = lpoMetaSchema.safeParse({
      lpo_number: "LPO-001",
      lpo_amount: -100,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Amount must be positive.");
  });

  it("allows undefined optional fields", () => {
    const result = lpoMetaSchema.safeParse({
      lpo_number: "LPO-001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lpo_validity_date).toBeUndefined();
      expect(result.data.lpo_amount).toBeUndefined();
    }
  });
});

describe("createLpoDraftFromQuote", () => {
  it("copies quote currency and discount metadata into the generated LPO", async () => {
    const { documentsQuery } = mockSupabase();
    vi.mocked(getQuoteWithLineItems).mockResolvedValue(createQuote());

    const result = await createLpoDraftFromQuote(QUOTE_ID);

    expect(result).toEqual({ ok: true, lpoId: LPO_ID });
    expect(documentsQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "local_purchase_order",
        currency: "AED",
        discount_value: 10,
        discount_type: "percent",
        source_document_id: QUOTE_ID,
      }),
    );
  });
});
