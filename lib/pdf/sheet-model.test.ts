import { describe, expect, it } from "vitest";

import type { VariableContext } from "@/lib/documents/variables";
import type { LineItemRow } from "@/types";
import {
  buildInvoicePdfModel,
  buildLpoPdfModel,
  buildQuotePdfModel,
  buildSheetPdfModel,
  type PdfSheetDocument,
} from "./sheet-model";

const ctx: VariableContext = {
  client: {
    name: "Nova Retail",
    contact_name: "Sara Khalid",
    email: "sara.khalid@novaretail.ae",
    company: "Nova Retail FZ-LLC",
    phone: "+971-50-123-4567",
    address: "Sheikh Zayed Road, Dubai, UAE",
  },
  project: { title: null },
  brand: {
    business_name: "Hassan Studio",
    primary_color: "#2F7D4F",
    email_signature: null,
    logo_url: null,
  },
  sender: {
    name: "Layla Hassan",
    company_name: "Hassan Studio",
    email: "studio@example.com",
    address_line1: "Office 1203, Boulevard Plaza Tower 1",
    address_line2: null,
    city: "Downtown Dubai",
    region: null,
    postal_code: null,
    country: "AE",
    vat_number: "100123456700003",
    gstin: null,
    vat_reg_no: null,
  },
  now: new Date("2026-09-27T00:00:00Z"),
};

function line(overrides: Partial<LineItemRow> = {}): LineItemRow {
  return {
    id: "li-1",
    document_id: "doc-1",
    description: "Website design and dev",
    notes: null,
    quantity: 1,
    unit_price: 10000,
    tax_rate: 5,
    sort_order: 0,
    hsn_sac_code: null,
    created_at: "2026-09-26T00:00:00Z",
    updated_at: "2026-09-26T00:00:00Z",
    ...overrides,
  };
}

function doc(overrides: Partial<PdfSheetDocument> = {}): PdfSheetDocument {
  return {
    type: "quote",
    status: "sent",
    created_at: "2026-09-26T10:00:00Z",
    currency: "AED",
    quote_number: "QUO-0004",
    invoice_number: null,
    lpo_number: null,
    valid_until: "2026-09-28",
    due_date: null,
    payment_terms: null,
    notes_footer: null,
    discount_value: 0,
    discount_type: "percent",
    tax_mode: "none",
    tax_rate: 0,
    tds_enabled: false,
    tds_rate: 0,
    lpo_amount: null,
    lpo_validity_date: null,
    lpo_reference_number: null,
    ...overrides,
  };
}

const grand = (rows: { label: string; value: string; kind: string }[]) =>
  rows.find((r) => r.kind === "grand");

describe("buildQuotePdfModel", () => {
  // QUO-0004: VAT 5% set on the document.
  const model = buildQuotePdfModel({
    document: doc({ tax_mode: "vat", tax_rate: 5 }),
    lineItems: [line({ tax_rate: 0 })],
    variableContext: ctx,
  });

  it("includes document-level VAT in the total", () => {
    expect(model.totals).toContainEqual({ label: "VAT 5%", value: "500.00", kind: "row" });
    expect(grand(model.totals)).toEqual({ label: "Total AED", value: "10,500.00", kind: "grand" });
  });

  it("shows issued date, validity and VAT in the summary column", () => {
    const summary = model.parties[2];
    expect("details" in summary && summary.details.map((d) => d.label)).toEqual([
      "Issued",
      "Valid until",
      "Subtotal",
      "VAT 5%",
      "Total AED",
    ]);
    expect("details" in summary && summary.details[1].value).toBe("28 Sept 2026");
  });

  it("leaves the on-screen valid-until banner out of the PDF", () => {
    expect("banner" in model).toBe(false);
  });

  it("has the status and brand colour", () => {
    expect(model.header.status.label).toBe("sent");
    expect(model.header.brandColor).toBe("#2F7D4F");
  });

  it("uses the full sender street address and client contact name like the sheet", () => {
    expect(model.header.metaLines).toEqual([
      "Layla Hassan",
      "studio@example.com",
      "Office 1203, Boulevard Plaza Tower 1, Downtown Dubai, AE",
    ]);
    expect(model.parties[0]).toEqual({
      label: "Prepared for",
      name: "Nova Retail FZ-LLC",
      lines: ["Sara Khalid", "sara.khalid@novaretail.ae", "Sheikh Zayed Road, Dubai, UAE"],
    });
  });

  it("puts tax IDs in the page marker", () => {
    expect(model.marker).toBe("Hassan Studio · TRN 100123456700003");
  });
});

describe("buildInvoicePdfModel", () => {
  // INV-0006: no document tax mode, 5% on the line item.
  const model = buildInvoicePdfModel({
    document: doc({ type: "invoice", invoice_number: "INV-0006", quote_number: null, status: "paid" }),
    lineItems: [line()],
    variableContext: ctx,
  });

  it("includes line-item tax in the total", () => {
    expect(model.totals).toContainEqual({ label: "Tax 5%", value: "500.00", kind: "row" });
    expect(grand(model.totals)).toEqual({ label: "Total due (AED)", value: "10,500.00", kind: "grand" });
  });

  it("maps the status pill like the invoice sheet", () => {
    expect(model.header.status).toEqual({ label: "Paid", variant: "success" });
  });
});

describe("buildLpoPdfModel", () => {
  const model = buildLpoPdfModel({
    document: doc({ type: "local_purchase_order", lpo_number: "LPO-0001", quote_number: null, status: "sent" }),
    lineItems: [line()],
    variableContext: ctx,
    sourceQuote: { number: "QUO-0004", title: null },
  });

  it("includes line-item tax and the authorised total", () => {
    expect(model.totals).toContainEqual({ label: "VAT 5%", value: "500.00", kind: "row" });
    expect(grand(model.totals)?.value).toBe("AED 10,500.00");
    expect(model.authorisation?.total).toBe("AED 10,500.00");
  });

  it("carries the authorisation copy and source quote", () => {
    expect(model.authorisation?.copy).toContain("against quote QUO-0004");
    expect(model.parties[1]).toMatchObject({ lines: ["Against quote QUO-0004"] });
    expect(model.header.docType).toBe("Purchase order");
  });
});

describe("buildSheetPdfModel", () => {
  it("returns null for types without a sheet model", () => {
    expect(
      buildSheetPdfModel({ document: doc({ type: "proposal" }), lineItems: [], variableContext: ctx }),
    ).toBeNull();
  });

  it("dispatches invoices to the invoice model", () => {
    const m = buildSheetPdfModel({
      document: doc({ type: "invoice", invoice_number: "INV-0006" }),
      lineItems: [line()],
      variableContext: ctx,
    });
    expect(m?.header.docType).toBe("Invoice");
  });
});
