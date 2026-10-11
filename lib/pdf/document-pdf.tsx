/* eslint-disable jsx-a11y/alt-text */
import React from "react";
import {
  Document,
  Image,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";

import type { DocumentRow, DocumentType, LineItemRow, TiptapDoc } from "@/types";
import type { VariableContext } from "@/lib/documents/variables";
import type { TaxMode } from "@/lib/documents/tax/compute-tax";
import { computeSheetTotals } from "@/components/features/documents/sheets/types";
import type { PdfSheetModel } from "./sheet-model";
import { SheetPdfPage } from "./sheet-pdf";
import { makePdfStyles, resolvePdfFont } from "./styles";
import { renderTiptapContent } from "./tiptap-to-pdf";

const TYPE_LABELS: Record<DocumentType, string> = {
  proposal: "Proposal",
  quote: "Quote",
  invoice: "Invoice",
  receipt: "Receipt",
  local_purchase_order: "Local Purchase Order",
  other: "Document",
  statement: "Statement",
  credit_note: "Credit Note",
  delivery_note: "Delivery Note",
};

type StructuredDocData = {
  number: string | null;
  due_or_valid_date: string | null;
  date_label: string;
  payment_terms?: string | null;
  notes_footer: string | null;
  line_items: LineItemRow[];
  currency: string;
  discount_value?: number;
  discount_type?: "percent" | "flat";
};

type DocumentPdfProps = {
  document: Pick<DocumentRow, "id" | "type" | "title" | "created_at">;
  content: TiptapDoc;
  variableContext: VariableContext;
  brandLogoUrl?: string | null;
  primaryColor?: string | null;
  brandFont?: string | null;
  businessName?: string | null;
  /** ZATCA Phase 1 QR data URL — only set for qualifying KSA VAT invoices. */
  zatcaQrDataUrl?: string | null;
  /**
   * Quote / invoice / LPO: the same view-model the on-screen sheet renders
   * (see `sheet-model.ts`). When set, it replaces the typed `*Data` props.
   */
  sheetModel?: PdfSheetModel | null;
  proposalData?: {
    proposal_number: string | null;
    notes_footer: string | null;
    line_items: LineItemRow[];
    currency: string;
    discount_value?: number;
    discount_type?: "percent" | "flat";
  } | null;
  voucherData?: {
    receiptNumber: string | null;
    paidAt: string | Date;
    amount: number;
    currency: string;
    method: string;
    reference: string | null;
    notes: string | null;
    invoiceNumber: string | null;
    invoiceTitle: string;
  } | null;
};

function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    cash: "Cash",
    cheque: "Cheque",
    card: "Card",
    other: "Other",
  };
  return labels[method] ?? method;
}

function fmtAmount(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------- StatusPillPdf ----------

const STATUS_PILL_MAP: Record<string, { label: string; bg: string; color: string }> = {
  paid: { label: "Paid", bg: "#E6F2EB", color: "#1F8A52" },
  overdue: { label: "Overdue", bg: "#FAF0DD", color: "#B36A12" },
  sent: { label: "Sent · awaiting payment", bg: "#EAEEFC", color: "#3550E0" },
  partial: { label: "Partially paid", bg: "#FAF0DD", color: "#B36A12" },
  draft: { label: "Draft", bg: "#F4F4F1", color: "#54585F" },
};

function StatusPillPdf({
  status,
  styles,
}: {
  status: string;
  styles: ReturnType<typeof makePdfStyles>;
}) {
  const pill = STATUS_PILL_MAP[status] ?? { label: status, bg: "#F4F4F1", color: "#54585F" };
  return (
    <View
      style={{
        ...styles.statusPill,
        alignSelf: "flex-end",
        marginTop: 10,
        backgroundColor: pill.bg,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
      }}
    >
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: pill.color }} />
      <Text style={{ ...styles.statusPillText, color: pill.color }}>{pill.label}</Text>
    </View>
  );
}

// ---------- MetaSection ----------

type MetaSectionProps = {
  variableContext: VariableContext;
  issued: string;
  docType: DocumentType;
  currency?: string;
  proposalData?: DocumentPdfProps["proposalData"];
  voucherData?: DocumentPdfProps["voucherData"];
  styles: ReturnType<typeof makePdfStyles>;
  fontFamily: string;
};

function MetaSection({
  variableContext,
  issued,
  docType,
  currency,
  proposalData,
  voucherData,
  styles,
  fontFamily,
}: MetaSectionProps) {
  const sender = variableContext.sender;
  const client = variableContext.client;

  // Build address lines for sender
  const senderLines: string[] = [];
  if (sender?.address_line1) senderLines.push(sender.address_line1);
  if (sender?.address_line2) senderLines.push(sender.address_line2);
  const cityRegionPostal = [sender?.city, sender?.region, sender?.postal_code]
    .filter(Boolean)
    .join(", ");
  if (cityRegionPostal) senderLines.push(cityRegionPostal);
  if (sender?.country) senderLines.push(sender.country);

  // Build details rows based on doc type
  const detailRows: { label: string; value: string; bold?: boolean }[] = [];

  detailRows.push({ label: "Issued", value: issued });

  if (docType === "proposal" && proposalData) {
    if (currency) {
      detailRows.push({ label: "Currency", value: currency });
    }
  } else if (docType === "receipt" && voucherData) {
    if (voucherData.receiptNumber) {
      detailRows.push({ label: "Receipt #", value: voucherData.receiptNumber });
    }
    detailRows.push({
      label: "Date Paid",
      value: new Date(voucherData.paidAt).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });
    detailRows.push({
      label: "Method",
      value: formatPaymentMethod(voucherData.method),
    });
  }

  const billedToLabel = "Billed to";

  return (
    <View style={styles.metaSection}>
      {/* Billed to column */}
      <View style={styles.metaCol}>
        <Text style={styles.metaLabel}>{billedToLabel}</Text>
        {client?.company ? (
          <Text style={styles.metaValue}>{client.company}</Text>
        ) : client?.name ? (
          <Text style={styles.metaValue}>{client.name}</Text>
        ) : null}
        {client?.name && client.name !== client?.company ? (
          <Text style={styles.metaMuted}>{client.name}</Text>
        ) : null}
        {client?.address ? (
          <Text style={styles.metaMuted}>{client.address}</Text>
        ) : null}
        {client?.email ? (
          <Text style={styles.metaMuted}>{client.email}</Text>
        ) : null}
        {client?.phone ? (
          <Text style={styles.metaMuted}>{client.phone}</Text>
        ) : null}
      </View>

      {/* Project column */}
      <View style={styles.metaCol}>
        <Text style={styles.metaLabel}>Project</Text>
        {variableContext.project?.title ? (
          <Text style={styles.metaValue}>{variableContext.project.title}</Text>
        ) : null}
      </View>

      {/* Details / Summary column */}
      <View style={styles.metaCol}>
        <Text style={styles.metaLabel}>
          Details
        </Text>
        {detailRows.map((row) => (
          <View
            key={row.label}
            style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}
          >
            <Text style={styles.metaMuted}>{row.label}:</Text>
            <Text style={row.bold ? { ...styles.metaValue, fontSize: 9 } : styles.metaMuted}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------- Main component ----------

export function DocumentPdf({
  document,
  content,
  variableContext,
  brandLogoUrl,
  primaryColor,
  brandFont,
  businessName,
  proposalData,
  voucherData,
  zatcaQrDataUrl,
  sheetModel,
}: DocumentPdfProps) {
  const color = primaryColor || "#6366f1";
  const fontFamily = resolvePdfFont(brandFont);
  const styles = makePdfStyles(color, fontFamily);

  const issued = new Date(document.created_at).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Resolve doc number for header display
  const docNumber =
    document.type === "proposal"
      ? (proposalData?.proposal_number ?? null)
      : document.type === "receipt"
      ? (voucherData?.receiptNumber ?? null)
      : null;

  // Resolve notes footer
  const notesFooter =
    document.type === "proposal" ? (proposalData?.notes_footer ?? null) : null;

  // Quotes, invoices and LPOs mirror the on-screen sheet exactly.
  if (sheetModel) {
    return (
      <Document
        title={document.title}
        author={businessName ?? undefined}
        creator="Manpower"
      >
        <SheetPdfPage
          model={sheetModel}
          fontFamily={fontFamily}
          zatcaQrDataUrl={document.type === "invoice" ? zatcaQrDataUrl : null}
        />
      </Document>
    );
  }

  // Receipts use a dedicated voucher layout that mirrors the on-screen sheet.
  if (document.type === "receipt" && voucherData) {
    return (
      <Document
        title={document.title}
        author={businessName ?? undefined}
        creator="Manpower"
      >
        <ReceiptPdfPage
          voucherData={voucherData}
          variableContext={variableContext}
          brandLogoUrl={brandLogoUrl}
          businessName={businessName}
          fontFamily={fontFamily}
        />
      </Document>
    );
  }

  return (
    <Document
      title={document.title}
      author={businessName ?? undefined}
      creator="Manpower"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            {brandLogoUrl ? (
              <Image src={brandLogoUrl} style={styles.logo} />
            ) : (
              <View style={styles.brandmark}>
                <Text style={styles.brandmarkLetter}>
                  {(businessName ?? "?")[0]?.toUpperCase() ?? "?"}
                </Text>
              </View>
            )}
            <View style={styles.headerLeftText}>
              <Text style={styles.orgName}>{businessName ?? ""}</Text>
              {variableContext.sender ? (
                <Text style={styles.orgContact}>
                  {[
                    variableContext.sender.name !== businessName ? variableContext.sender.name : null,
                    variableContext.sender.email,
                    [variableContext.sender.city, variableContext.sender.country].filter(Boolean).join(", "),
                  ].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
              {variableContext.sender?.vat_number ? (
                <Text style={styles.orgContact}>TRN {variableContext.sender.vat_number}</Text>
              ) : null}
              {variableContext.sender?.gstin ? (
                <Text style={styles.orgContact}>GSTIN {variableContext.sender.gstin}</Text>
              ) : null}
              {variableContext.sender?.vat_reg_no ? (
                <Text style={styles.orgContact}>VAT Reg No {variableContext.sender.vat_reg_no}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docType}>{TYPE_LABELS[document.type]}</Text>
            {docNumber ? (
              <Text style={styles.docNumber}>{docNumber}</Text>
            ) : null}
          </View>
        </View>

        {/* Separator — matches web hr between header and parties */}
        <View style={{ marginHorizontal: 48, borderBottomWidth: 1, borderBottomColor: "#ECECE7", marginBottom: 18 }} />

        {/* Parties */}
        <MetaSection
          variableContext={variableContext}
          issued={issued}
          docType={document.type}
          currency={
            proposalData?.currency ?? voucherData?.currency ?? undefined
          }
          proposalData={proposalData}
          voucherData={voucherData}
          styles={styles}
          fontFamily={fontFamily}
        />

        {/* 4. Body */}
        <View style={styles.body}>
          {/* Proposal: Tiptap body + optional line items */}
          {document.type === "proposal" ? (
            <>
              {renderTiptapContent(content.content, { styles, primaryColor: color })}
              {proposalData && proposalData.line_items.length > 0 ? (
                <InvoiceLineItemsPdf
                  lineItems={proposalData.line_items}
                  currency={proposalData.currency}
                  styles={styles}
                  color={color}
                  discountValue={proposalData.discount_value ?? 0}
                  discountType={proposalData.discount_type ?? "percent"}
                />
              ) : null}
            </>
          ) : null}

          {/* Other / fallback: Tiptap body */}
          {document.type !== "proposal" && document.type !== "receipt"
            ? renderTiptapContent(content.content, { styles, primaryColor: color })
            : null}
        </View>

        {/* Doc footer — only when there's content to show */}
        {notesFooter ? (
          <View style={styles.docFooter}>
            <View style={styles.docFooterRight}>
              <Text style={styles.docFooterTitle}>Notes</Text>
              {notesFooter ? (
                <Text style={styles.docFooterText}>{notesFooter}</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Page marker */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {[
              businessName,
              variableContext.sender?.vat_number ? `TRN ${variableContext.sender.vat_number}` : null,
              variableContext.sender?.gstin ? `GSTIN ${variableContext.sender.gstin}` : null,
              variableContext.sender?.vat_reg_no ? `VAT Reg No ${variableContext.sender.vat_reg_no}` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

// ---------- ReceiptPdfPage ----------
// Mirrors components/features/documents/sheets/receipt-sheet.tsx so the
// downloaded PDF matches the on-screen voucher design.

const RC = {
  ink: "#14161A",
  muted: "#54585F",
  dim: "#898E96",
  hair: "#ECECE7",
  hairStrong: "#D9D9D2",
  panel: "#FBFBF9",
  green: "#1F8A52",
  whiteMuted: "rgba(255,255,255,0.6)",
  whiteFaint: "rgba(255,255,255,0.55)",
};

function fmtReceiptDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReceiptPdfPage({
  voucherData,
  variableContext,
  brandLogoUrl,
  businessName,
  fontFamily,
}: {
  voucherData: NonNullable<DocumentPdfProps["voucherData"]>;
  variableContext: VariableContext;
  brandLogoUrl?: string | null;
  businessName?: string | null;
  fontFamily: string;
}) {
  const { brand, sender, client } = variableContext;
  const orgName = brand?.business_name ?? sender?.company_name ?? businessName ?? "Your Business";
  const vatLine = sender?.vat_number ? `TRN ${sender.vat_number}` : null;
  const gstinLine = sender?.gstin ? `GSTIN ${sender.gstin}` : null;
  const vatRegLine = sender?.vat_reg_no ? `VAT Reg No ${sender.vat_reg_no}` : null;

  const clientCompany = client?.company ?? client?.name ?? "—";
  const clientLines = [client?.contact_name, client?.email, client?.address].filter(
    Boolean,
  ) as string[];

  const dateReceived = fmtReceiptDate(voucherData.paidAt);
  const currency = voucherData.currency;
  const amount = voucherData.amount;

  // Derived ledger + allocation, matching the on-screen page composition.
  const allocations =
    voucherData.invoiceNumber
      ? [
          {
            documentId: voucherData.invoiceNumber,
            projectTitle: voucherData.invoiceTitle,
            issuedDate: "—",
            invoiceTotal: amount,
            applied: amount,
            balance: 0,
          },
        ]
      : [];
  const openingBalance = amount;
  const closingBalance = 0;

  const PAD = 48;
  const sectionPad = { paddingLeft: PAD, paddingRight: PAD };

  return (
    <Page
      size="A4"
      style={{
        fontFamily,
        fontSize: 9,
        color: RC.ink,
        paddingTop: 0,
        paddingBottom: 56,
        paddingHorizontal: 0,
        backgroundColor: "#ffffff",
      }}
    >
      {/* Voucher band (dark, full-bleed) */}
      <View
        style={{
          backgroundColor: RC.ink,
          paddingVertical: 22,
          paddingLeft: PAD,
          paddingRight: PAD,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 26,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
          {brandLogoUrl ? (
            <Image
              src={brandLogoUrl}
              style={{ width: 28, height: 28, objectFit: "contain" }}
            />
          ) : (
            <View
              style={{
                width: 28,
                height: 28,
                backgroundColor: "#ffffff",
                borderRadius: 7,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: 700, color: RC.ink }}>
                {orgName[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
          )}
          <View>
            <Text style={{ fontFamily: "Chillax", fontSize: 12, fontWeight: 600, color: "#ffffff" }}>
              {orgName}
            </Text>
            {vatLine ? (
              <Text style={{ fontSize: 8.5, color: RC.whiteFaint, marginTop: 2 }}>{vatLine}</Text>
            ) : null}
            {gstinLine ? (
              <Text style={{ fontSize: 8.5, color: RC.whiteFaint, marginTop: 2 }}>{gstinLine}</Text>
            ) : null}
            {vatRegLine ? (
              <Text style={{ fontSize: 8.5, color: RC.whiteFaint, marginTop: 2 }}>{vatRegLine}</Text>
            ) : null}
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontFamily: "Chillax", fontSize: 22, fontWeight: 600, color: "#ffffff", letterSpacing: -0.7 }}>
            Receipt
          </Text>
          {voucherData.receiptNumber ? (
            <Text style={{ fontFamily: "Courier", fontSize: 9, color: RC.whiteMuted, marginTop: 4 }}>
              {voucherData.receiptNumber}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Parties */}
      <View style={{ ...sectionPad, flexDirection: "row", gap: 28, marginBottom: 26 }}>
        <View style={{ flex: 1 }}>
          <Text style={rcLabel}>Received from</Text>
          <Text style={{ fontSize: 11, fontWeight: 500, marginBottom: 2 }}>{clientCompany}</Text>
          {clientLines.map((line) => (
            <Text key={line} style={{ fontSize: 9, color: RC.muted, lineHeight: 1.55 }}>
              {line}
            </Text>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rcLabel}>Payment details</Text>
          <RcDetailRow label="Date received" value={dateReceived} valueBold />
          {voucherData.method ? (
            <RcDetailRow label="Method" value={formatPaymentMethod(voucherData.method)} />
          ) : null}
          {voucherData.reference ? (
            <RcDetailRow label="Bank reference" value={voucherData.reference} mono />
          ) : null}
          <RcDetailRow label="Currency" value={currency} />
        </View>
      </View>

      {/* Big amount */}
      <View style={{ ...sectionPad, marginBottom: 24 }}>
        <View
          style={{
            backgroundColor: RC.panel,
            borderWidth: 1,
            borderColor: RC.hair,
            borderRadius: 12,
            paddingVertical: 18,
            paddingHorizontal: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={rcLabel}>Amount received</Text>
          <Text
            style={{
              fontFamily: "Chillax",
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: -0.5,
            }}
          >
            {`${currency} ${fmtAmount(amount)}`}
          </Text>
        </View>
      </View>

      {/* Allocations */}
      {allocations.length > 0 ? (
        <View style={{ ...sectionPad, marginBottom: 24 }}>
          <Text style={{ ...rcLabel, marginBottom: 8 }}>Allocated to</Text>
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: RC.hairStrong, paddingBottom: 8 }}>
            <Text style={[rcTh, { flex: 2 }]}>Document</Text>
            <Text style={[rcTh, { flex: 2 }]}>Project</Text>
            <Text style={[rcTh, { flex: 1.4 }]}>Issued</Text>
            <Text style={[rcTh, { flex: 1.6, textAlign: "right" }]}>Invoice total</Text>
            <Text style={[rcTh, { flex: 1.4, textAlign: "right" }]}>Applied</Text>
            <Text style={[rcTh, { flex: 1.4, textAlign: "right" }]}>Balance</Text>
          </View>
          {allocations.map((row) => (
            <View
              key={row.documentId}
              style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: RC.hair, paddingVertical: 10 }}
            >
              <Text style={[rcTd, { flex: 2, fontFamily: "Courier" }]}>{row.documentId}</Text>
              <Text style={[rcTd, { flex: 2 }]}>{row.projectTitle ?? "—"}</Text>
              <Text style={[rcTd, { flex: 1.4 }]}>{row.issuedDate}</Text>
              <Text style={[rcTd, { flex: 1.6, textAlign: "right" }]}>{fmtAmount(row.invoiceTotal)}</Text>
              <Text style={[rcTd, { flex: 1.4, textAlign: "right", color: RC.green, fontWeight: 500 }]}>
                {fmtAmount(row.applied)}
              </Text>
              <Text style={[rcTd, { flex: 1.4, textAlign: "right" }]}>{fmtAmount(row.balance)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Ledger + Notes */}
      <View style={{ ...sectionPad, flexDirection: "row", gap: 28 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...rcLabel, marginBottom: 8 }}>Account ledger</Text>
          <View
            style={{
              backgroundColor: RC.panel,
              borderWidth: 1,
              borderColor: RC.hair,
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          >
            <View style={rcPayLine}>
              <Text style={{ color: RC.dim, fontSize: 9 }}>Opening balance</Text>
              <Text style={{ fontSize: 9, fontWeight: 500 }}>{fmtAmount(openingBalance)}</Text>
            </View>
            <View style={rcPayLine}>
              <Text style={{ color: RC.dim, fontSize: 9 }}>This payment</Text>
              <Text style={{ fontSize: 9, fontWeight: 500, color: RC.green }}>
                {`-${fmtAmount(amount)}`}
              </Text>
            </View>
            <View
              style={{
                ...rcPayLine,
                borderTopWidth: 1,
                borderTopColor: RC.hair,
                marginTop: 4,
                paddingTop: 8,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: 500 }}>Closing balance</Text>
              <Text style={{ fontSize: 9, fontWeight: 500 }}>{fmtAmount(closingBalance)}</Text>
            </View>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ ...rcLabel, marginBottom: 8 }}>Notes</Text>
          {voucherData.notes ? (
            <Text style={{ fontSize: 9, color: RC.muted, lineHeight: 1.6 }}>{voucherData.notes}</Text>
          ) : null}
        </View>
      </View>

      {/* PAID stamp — rendered last so it overlays the content above */}
      <View
        style={{
          position: "absolute",
          top: 236,
          right: 250,
          borderWidth: 2,
          borderColor: RC.green,
          borderRadius: 6,
          paddingVertical: 6,
          paddingHorizontal: 18,
          backgroundColor: "rgba(31,138,82,0.06)",
          alignItems: "center",
          transform: "rotate(-12deg)",
        }}
      >
        <Text style={{ fontFamily: "Chillax", fontWeight: 700, fontSize: 22, color: RC.green, letterSpacing: 0.5 }}>
          PAID
        </Text>
        <Text style={{ fontSize: 7, letterSpacing: 1.4, fontWeight: 500, color: RC.green, marginTop: 2 }}>
          {dateReceived.toUpperCase()}
        </Text>
      </View>

      {/* Page marker */}
      <View
        style={{
          position: "absolute",
          bottom: 24,
          left: PAD,
          right: PAD,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
        fixed
      >
        <Text style={{ fontSize: 7.5, color: RC.dim }}>
          This document is a system-generated receipt — no signature required for validity.
        </Text>
        <Text
          style={{ fontSize: 7.5, color: RC.dim }}
          render={({ pageNumber, totalPages }) =>
            voucherData.receiptNumber
              ? `${voucherData.receiptNumber} · Page ${pageNumber} of ${totalPages}`
              : `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>
    </Page>
  );
}

const rcLabel = {
  fontSize: 8,
  fontWeight: 600 as const,
  letterSpacing: 1,
  color: "#898E96",
  marginBottom: 6,
  textTransform: "uppercase" as const,
};

const rcTh = {
  fontSize: 8,
  fontWeight: 600 as const,
  letterSpacing: 1,
  color: "#898E96",
  textTransform: "uppercase" as const,
};

const rcTd = {
  fontSize: 9,
  color: "#14161A",
};

const rcPayLine = {
  flexDirection: "row" as const,
  justifyContent: "space-between" as const,
  paddingVertical: 4,
};

function RcDetailRow({
  label,
  value,
  valueBold,
  mono,
}: {
  label: string;
  value: string;
  valueBold?: boolean;
  mono?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
      <Text style={{ fontSize: 9, color: "#898E96" }}>{label}</Text>
      <Text
        style={{
          fontSize: 9,
          color: "#14161A",
          fontWeight: valueBold ? 500 : 400,
          fontFamily: mono ? "Courier" : undefined,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ---------- InvoiceLineItemsPdf ----------

function InvoiceLineItemsPdf({
  lineItems,
  currency,
  styles,
  color,
  discountValue = 0,
  discountType = "percent",
  descHeader = "Description",
  amountHeader = "Amount",
  grandLabel,
  taxMode,
  taxRate,
  tdsEnabled = false,
  tdsRate = 0,
}: {
  lineItems: LineItemRow[];
  currency: string;
  styles: ReturnType<typeof makePdfStyles>;
  color: string;
  discountValue?: number;
  discountType?: "percent" | "flat";
  descHeader?: string;
  amountHeader?: string;
  grandLabel?: string;
  taxMode?: TaxMode;
  taxRate?: number;
  tdsEnabled?: boolean;
  tdsRate?: number;
}) {
  const fmtNum = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Same totals function as the on-screen sheets: honours line-item tax
  // when the document has no tax mode.
  const totals = computeSheetTotals(
    lineItems.map((li) => ({
      id: li.id,
      description: li.description ?? "",
      subDescription: null,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unit_price),
      taxRate: Number(li.tax_rate ?? 0),
    })),
    discountValue,
    discountType,
    taxMode ?? "none",
    taxRate ?? 0,
    tdsEnabled,
    tdsRate,
  );
  const { subtotal, discount, taxLines, total } = totals;
  const tdsAmount = totals.tds;
  const netReceived = totals.netReceived;

  const showHsn = lineItems.some((li) => li.hsn_sac_code);

  // Column layout — matches web .items td widths at 0.744x scale
  const colDesc = { flex: 1 };
  const colHsn = { width: 56, textAlign: "right" as const };
  const colQty = { width: 42, textAlign: "right" as const };
  const colRate = { width: 74, textAlign: "right" as const };
  const colTotal = { width: 82, textAlign: "right" as const };

  const cellStyle = { fontSize: 9.5, paddingVertical: 10, paddingHorizontal: 0 };
  const headerCell = {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#898E96",
    textTransform: "uppercase" as const,
    letterSpacing: 0.9,
    paddingVertical: 7,
    paddingHorizontal: 0,
  };

  // Totals block width: web 280px * 0.744 ≈ 208pt
  const totalsWidth = 208;

  return (
    <View style={{ marginBottom: 18 }}>
      {/* Table header */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: "#D9D9D2",
          borderBottomStyle: "solid",
        }}
      >
        <Text style={{ ...headerCell, ...colDesc }}>{descHeader}</Text>
        {showHsn && <Text style={{ ...headerCell, ...colHsn }}>HSN/SAC</Text>}
        <Text style={{ ...headerCell, ...colQty }}>Qty</Text>
        <Text style={{ ...headerCell, ...colRate }}>Rate</Text>
        <Text style={{ ...headerCell, ...colTotal }}>{amountHeader}</Text>
      </View>
      {/* Rows */}
      {lineItems.map((li) => (
        <View
          key={li.id}
          style={{
            flexDirection: "row",
            borderBottomWidth: 1,
            borderBottomColor: "#ECECE7",
            borderBottomStyle: "solid",
            alignItems: "flex-start",
          }}
        >
          <View style={{ ...colDesc, paddingVertical: 10 }}>
            <Text style={{ fontSize: 9.5, color: "#14161A", fontWeight: 600 }}>{li.description}</Text>
          </View>
          {showHsn && (
            <Text style={{ ...cellStyle, ...colHsn, color: "#54585F" }}>
              {li.hsn_sac_code ?? "—"}
            </Text>
          )}
          <Text style={{ ...cellStyle, ...colQty, color: "#54585F" }}>{Number(li.quantity)}</Text>
          <Text style={{ ...cellStyle, ...colRate, color: "#54585F" }}>{fmtNum(Number(li.unit_price))}</Text>
          <Text style={{ ...cellStyle, ...colTotal, color: "#14161A", fontWeight: 600 }}>
            {fmtNum(Number(li.quantity) * Number(li.unit_price))}
          </Text>
        </View>
      ))}
      {/* Totals — right-aligned block matching web .totals__inner */}
      <View style={{ alignItems: "flex-end", marginTop: 12 }}>
        <View style={{ width: totalsWidth, gap: 5 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 9.5, color: "#898E96" }}>Subtotal</Text>
            <Text style={{ fontSize: 9.5, color: "#14161A" }}>{fmtNum(subtotal)}</Text>
          </View>
          {discount > 0 ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 9.5, color: "#898E96" }}>
                {discountType === "percent"
                  ? `Discount (${discountValue}%)`
                  : "Discount"}
              </Text>
              <Text style={{ fontSize: 9.5, color: "#14161A" }}>−{fmtNum(discount)}</Text>
            </View>
          ) : null}
          {taxLines.map((line) => (
            <View key={line.label} style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 9.5, color: "#898E96" }}>{line.label}</Text>
              <Text style={{ fontSize: 9.5, color: "#14161A" }}>{fmtNum(line.amount)}</Text>
            </View>
          ))}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              borderTopWidth: 1,
              borderTopColor: "#D9D9D2",
              borderTopStyle: "solid",
              paddingTop: 7,
              marginTop: 3,
            }}
          >
            <Text style={{ fontFamily: "Chillax", fontSize: 13.5, fontWeight: 600, color: "#14161A", letterSpacing: -0.2 }}>
              {grandLabel ?? `Total due (${currency})`}
            </Text>
            <Text style={{ fontFamily: "Chillax", fontSize: 13.5, fontWeight: 600, color: "#14161A", letterSpacing: -0.2 }}>
              {fmtNum(total)}
            </Text>
          </View>
          {tdsAmount > 0 ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 9.5, color: "#898E96" }}>TDS deduction ({tdsRate}%)</Text>
              <Text style={{ fontSize: 9.5, color: "#14161A" }}>−{fmtNum(tdsAmount)}</Text>
            </View>
          ) : null}
          {tdsAmount > 0 ? (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderTopWidth: 1,
                borderTopColor: "#D9D9D2",
                borderTopStyle: "solid",
                paddingTop: 5,
                marginTop: 2,
              }}
            >
              <Text style={{ fontSize: 9.5, color: "#898E96" }}>Net received</Text>
              <Text style={{ fontSize: 9.5, color: "#14161A" }}>{fmtNum(netReceived)}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
