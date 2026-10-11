/**
 * Pure view-models for the quote / invoice / LPO PDFs.
 *
 * Each builder mirrors the matching on-screen sheet in
 * `components/features/documents/sheets/*-sheet.tsx` — same data, same totals
 * function, same labels — so the PDF a client receives matches what the
 * freelancer saw in the app. The React-PDF layer (`sheet-pdf.tsx`) only draws
 * what these return.
 */
import type { VariableContext } from "@/lib/documents/variables";
import { computeLpoSheetTotals } from "@/lib/documents/lpo/sheet-totals";
import {
  computeSheetTotals,
  formatSheetAmount,
  formatSheetCurrency,
  formatSheetDate,
  type SheetLineItem,
} from "@/components/features/documents/sheets/types";
import {
  toInvoiceSheetStatus,
  toLpoSheetStatus,
  toQuoteSheetStatus,
  type SheetStatus,
} from "@/components/features/documents/sheets/sheet-status";
import type { DocumentRow, LineItemRow } from "@/types";

export type PdfSheetDocument = Pick<
  DocumentRow,
  | "type"
  | "status"
  | "created_at"
  | "currency"
  | "quote_number"
  | "invoice_number"
  | "lpo_number"
  | "valid_until"
  | "due_date"
  | "payment_terms"
  | "notes_footer"
  | "discount_value"
  | "discount_type"
  | "tax_mode"
  | "tax_rate"
  | "tds_enabled"
  | "tds_rate"
  | "lpo_amount"
  | "lpo_validity_date"
  | "lpo_reference_number"
>;

export type PdfSheetInput = {
  document: PdfSheetDocument;
  lineItems: LineItemRow[];
  variableContext: VariableContext;
  /** LPO only — the quote this purchase order was raised against. */
  sourceQuote?: { number: string | null; title: string | null } | null;
};

export type PdfDetailRow = { label: string; value: string; bold?: boolean; mono?: boolean };

export type PdfPartyColumn =
  | { label: string; name: string | null; lines: string[] }
  | { label: string; details: PdfDetailRow[] };

export type PdfTotalsRow = { label: string; value: string; kind: "row" | "grand" | "note" };

export type PdfSheetModel = {
  header: {
    orgName: string | null;
    metaLines: string[];
    logoUrl: string | null;
    brandColor: string;
    docType: string;
    docNumber: string | null;
    status: SheetStatus;
  };
  parties: PdfPartyColumn[];
  /** LPO "What this order authorises" box. */
  authorisation: { copy: string; total: string } | null;
  itemsLabel: string | null;
  items: SheetLineItem[];
  descHeader: string;
  amountHeader: string;
  totals: PdfTotalsRow[];
  /** Quote: terms + notes to the left of the totals. */
  terms: { lines: string[]; notes: string | null } | null;
  /** Invoice: payment instructions + notes footer. */
  footer: { notes: string | null } | null;
  marker: string;
  accent: string;
};

const DEFAULT_ACCENT = "#3550E0";

function toSheetItems(lineItems: LineItemRow[]): SheetLineItem[] {
  return lineItems.map((item) => ({
    id: item.id,
    description: item.description ?? "",
    subDescription: null,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    taxRate: Number(item.tax_rate ?? 0),
    isOptional: (item as { is_optional?: boolean }).is_optional ?? false,
    hsnSac: item.hsn_sac_code ?? null,
  }));
}

function buildHeader(
  ctx: VariableContext,
  docType: string,
  docNumber: string | null,
  status: SheetStatus,
): PdfSheetModel["header"] {
  const { brand, sender } = ctx;
  const orgName = brand?.business_name ?? sender?.company_name ?? null;
  // Same three parts as DocHeader: name · email · street, city, country.
  const address = [sender?.address_line1, sender?.city, sender?.country]
    .filter(Boolean)
    .join(", ");
  const metaLines = [sender?.name ?? null, sender?.email ?? null, address || null].filter(
    (v): v is string => Boolean(v),
  );
  return {
    orgName,
    metaLines,
    logoUrl: brand?.logo_url ?? null,
    brandColor: brand?.primary_color ?? DEFAULT_ACCENT,
    docType,
    docNumber,
    status,
  };
}

function buildMarker(ctx: VariableContext): string {
  const { brand, sender } = ctx;
  const orgName = brand?.business_name ?? sender?.company_name ?? null;
  return [
    orgName,
    sender?.vat_number ? `TRN ${sender.vat_number}` : null,
    sender?.gstin ? `GSTIN ${sender.gstin}` : null,
    sender?.vat_reg_no ? `VAT Reg No ${sender.vat_reg_no}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function currencyOf(doc: PdfSheetDocument): string {
  return doc.currency ?? "USD";
}

// ---------------------------------------------------------------- Quote

export function buildQuotePdfModel({
  document: doc,
  lineItems,
  variableContext: ctx,
}: PdfSheetInput): PdfSheetModel {
  const currency = currencyOf(doc);
  const items = toSheetItems(lineItems);
  const totals = computeSheetTotals(
    items,
    Number(doc.discount_value ?? 0),
    doc.discount_type ?? "percent",
    doc.tax_mode ?? "none",
    Number(doc.tax_rate ?? 0),
  );
  const optionalsTotal = items
    .filter((i) => i.isOptional)
    .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const { client, project } = ctx;

  const totalsRows: PdfTotalsRow[] = [
    // QuoteSheet shows the post-discount amount as "Subtotal".
    { label: "Subtotal", value: formatSheetAmount(totals.total - totals.tax), kind: "row" },
    ...(totals.discount > 0 && totals.discountLabel
      ? [{ label: totals.discountLabel, value: `−${formatSheetAmount(totals.discount)}`, kind: "row" as const }]
      : []),
    ...totals.taxLines.map((l) => ({ label: l.label, value: formatSheetAmount(l.amount), kind: "row" as const })),
    { label: `Total ${currency}`, value: formatSheetAmount(totals.total), kind: "grand" },
    ...(optionalsTotal > 0
      ? [{ label: "With optionals", value: `+ ${formatSheetAmount(optionalsTotal)}`, kind: "note" as const }]
      : []),
  ];

  return {
    header: buildHeader(ctx, "Quote", doc.quote_number, toQuoteSheetStatus(doc.status)),
    parties: [
      {
        label: "Prepared for",
        name: client?.company ?? client?.name ?? null,
        lines: [client?.contact_name ?? null, client?.email ?? null, client?.address ?? null].filter(
          (v): v is string => Boolean(v),
        ),
      },
      { label: "Project", name: project?.title ?? null, lines: [] },
      {
        label: "Summary",
        details: [
          { label: "Issued", value: formatSheetDate(doc.created_at) },
          // The on-screen "Valid until" banner is a viewing aid; the PDF keeps
          // the date as a plain summary row.
          ...(doc.valid_until ? [{ label: "Valid until", value: formatSheetDate(doc.valid_until) }] : []),
          { label: "Subtotal", value: formatSheetAmount(totals.subtotal) },
          ...totals.taxLines.map((l) => ({ label: l.label, value: formatSheetAmount(l.amount) })),
          { label: `Total ${currency}`, value: formatSheetAmount(totals.total), bold: true },
        ],
      },
    ],
    authorisation: null,
    itemsLabel: null,
    items,
    descHeader: "Scope",
    amountHeader: "Subtotal",
    totals: totalsRows,
    terms: { lines: [], notes: doc.notes_footer ?? null },
    footer: null,
    marker: buildMarker(ctx),
    accent: ctx.brand?.primary_color ?? DEFAULT_ACCENT,
  };
}

// ---------------------------------------------------------------- Invoice

export function buildInvoicePdfModel({
  document: doc,
  lineItems,
  variableContext: ctx,
}: PdfSheetInput): PdfSheetModel {
  const currency = currencyOf(doc);
  const items = toSheetItems(lineItems).map((i) => ({ ...i, isOptional: false }));
  const totals = computeSheetTotals(
    items,
    Number(doc.discount_value ?? 0),
    doc.discount_type ?? "percent",
    doc.tax_mode ?? "none",
    Number(doc.tax_rate ?? 0),
    doc.tds_enabled ?? false,
    Number(doc.tds_rate ?? 0),
  );
  const { client, project } = ctx;

  const totalsRows: PdfTotalsRow[] = [
    { label: "Subtotal", value: formatSheetAmount(totals.subtotal), kind: "row" },
    ...(totals.discount > 0 && totals.discountLabel
      ? [{ label: totals.discountLabel, value: `−${formatSheetAmount(totals.discount)}`, kind: "row" as const }]
      : []),
    ...totals.taxLines.map((l) => ({ label: l.label, value: formatSheetAmount(l.amount), kind: "row" as const })),
    ...(totals.tds > 0
      ? [{
          label: `TDS deduction${totals.tdsRate != null ? ` (${totals.tdsRate}%)` : ""}`,
          value: `−${formatSheetAmount(totals.tds)}`,
          kind: "row" as const,
        }]
      : []),
    { label: `Total due (${currency})`, value: formatSheetAmount(totals.total), kind: "grand" },
    ...(totals.tds > 0
      ? [{ label: "Net received", value: formatSheetAmount(totals.netReceived), kind: "note" as const }]
      : []),
  ];

  return {
    header: buildHeader(ctx, "Invoice", doc.invoice_number, toInvoiceSheetStatus(doc.status)),
    parties: [
      {
        label: "Billed to",
        name: client?.company ?? client?.name ?? null,
        lines: [
          client?.contact_name ?? null,
          client?.address ?? null,
          client?.email ?? null,
          client?.phone ?? null,
        ].filter((v): v is string => Boolean(v)),
      },
      { label: "Project", name: project?.title ?? null, lines: [] },
      {
        label: "Details",
        details: [
          { label: "Issued", value: formatSheetDate(doc.created_at) },
          ...(doc.due_date ? [{ label: "Due", value: formatSheetDate(doc.due_date), bold: true }] : []),
          ...(doc.payment_terms ? [{ label: "Terms", value: doc.payment_terms }] : []),
          { label: "Currency", value: currency },
        ],
      },
    ],
    authorisation: null,
    itemsLabel: null,
    items,
    descHeader: "Description",
    amountHeader: "Amount",
    totals: totalsRows,
    terms: null,
    footer: { notes: doc.notes_footer ?? null },
    marker: buildMarker(ctx),
    accent: ctx.brand?.primary_color ?? DEFAULT_ACCENT,
  };
}

// ---------------------------------------------------------------- LPO

export function buildLpoPdfModel({
  document: doc,
  lineItems,
  variableContext: ctx,
  sourceQuote,
}: PdfSheetInput): PdfSheetModel {
  const currency = currencyOf(doc);
  const totals = computeLpoSheetTotals({
    lineItems,
    discountValue: Number(doc.discount_value ?? 0),
    discountType: doc.discount_type ?? "percent",
    lpoAmount: doc.lpo_amount != null ? Number(doc.lpo_amount) : null,
    taxMode: doc.tax_mode,
    taxRate: doc.tax_rate,
  });
  const items = toSheetItems(lineItems).map((i) => ({ ...i, isOptional: false }));
  const { client, project } = ctx;

  const sourceQuoteLabel = sourceQuote?.number ?? sourceQuote?.title ?? null;
  const referenceForInvoices = doc.lpo_number ?? doc.lpo_reference_number ?? "this purchase order";
  const copy = sourceQuoteLabel
    ? `Approved spend against quote ${sourceQuoteLabel} for the work below. All invoices must reference ${referenceForInvoices} and may not exceed the authorised total without a revised PO.`
    : `Approved spend for the work below. All invoices must reference ${referenceForInvoices} and may not exceed the authorised total without a revised PO.`;

  const totalsRows: PdfTotalsRow[] = [
    { label: "Subtotal", value: formatSheetAmount(totals.subtotal), kind: "row" },
    ...(totals.discount > 0 && totals.discountLabel
      ? [{ label: totals.discountLabel, value: `-${formatSheetAmount(totals.discount)}`, kind: "row" as const }]
      : []),
    ...(totals.tax > 0 && totals.taxLabel
      ? [{ label: totals.taxLabel, value: formatSheetAmount(totals.tax), kind: "row" as const }]
      : []),
    ...(totals.capAdjustment !== 0
      ? [{ label: "Rounding to PO cap", value: formatSheetAmount(totals.capAdjustment), kind: "row" as const }]
      : []),
    { label: "Authorised total", value: formatSheetCurrency(totals.authorisedTotal, currency), kind: "grand" },
  ];

  const header = buildHeader(ctx, "Purchase order", doc.lpo_number, toLpoSheetStatus(doc.status));
  if (doc.lpo_reference_number) {
    header.docNumber = [doc.lpo_number, `· ${doc.lpo_reference_number}`].filter(Boolean).join(" ");
  }

  return {
    header,
    parties: [
      {
        label: "Issued to (supplier)",
        name: client?.company ?? client?.name ?? null,
        lines: [
          client?.contact_name ? `Attn: ${client.contact_name}` : null,
          client?.address ?? null,
          client?.phone ?? null,
        ].filter((v): v is string => Boolean(v)),
      },
      {
        label: "Project & engagement",
        name: project?.title ?? null,
        lines: sourceQuoteLabel ? [`Against quote ${sourceQuoteLabel}`] : [],
      },
      {
        label: "Details",
        details: [
          { label: "Raised", value: formatSheetDate(doc.created_at) },
          {
            label: "Valid until",
            value: doc.lpo_validity_date ? formatSheetDate(doc.lpo_validity_date) : "—",
            bold: Boolean(doc.lpo_validity_date),
          },
          { label: "Terms", value: doc.payment_terms ?? "—" },
          { label: "Currency", value: currency, mono: true },
        ],
      },
    ],
    authorisation: { copy, total: formatSheetCurrency(totals.authorisedTotal, currency) },
    itemsLabel: "Ordered items",
    items,
    descHeader: "Description",
    amountHeader: "Amount",
    totals: totalsRows,
    terms: null,
    footer: null,
    marker: buildMarker(ctx),
    accent: ctx.brand?.primary_color ?? DEFAULT_ACCENT,
  };
}

/** Quote / invoice / LPO → model; any other type → null (legacy renderer). */
export function buildSheetPdfModel(input: PdfSheetInput): PdfSheetModel | null {
  switch (input.document.type) {
    case "quote":
      return buildQuotePdfModel(input);
    case "invoice":
      return buildInvoicePdfModel(input);
    case "local_purchase_order":
      return buildLpoPdfModel(input);
    default:
      return null;
  }
}
