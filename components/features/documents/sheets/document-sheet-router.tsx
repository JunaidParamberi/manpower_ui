import type { VariableContext } from "@/lib/documents/variables";
import type { DocumentRow, LineItemRow, TiptapDoc } from "@/types";
import { DocumentSheet } from "./document-sheet";
import { InvoiceSheet } from "./invoice-sheet";
import { QuoteSheet } from "./quote-sheet";
import { LpoSheet } from "./lpo-sheet";
import { ProposalDocumentClient } from "./proposal-document-client";
import { ReceiptSheet } from "./receipt-sheet";
import type { AllocationRow } from "./receipt-sheet";
import { formatSheetDate } from "./types";

type DocumentSheetRouterProps = {
  document: DocumentRow;
  variableContext: VariableContext;
  lineItems: LineItemRow[];

  invoiceMeta?: {
    dueDate: string | null;
    paymentTerms: string | null;
    currency: string;
    discountValue: number;
    discountType: "percent" | "flat";
    notesFooter: string | null;
  };

  quoteMeta?: {
    version: number | null;
    validUntil: string | null;
    currency: string;
    discountValue: number;
    discountType: "percent" | "flat";
    notesFooter: string | null;
    terms: string[];
    estimatedStart: string | null;
    duration: string | null;
    teamDescription: string | null;
  };

  proposalMeta?: {
    version: number | null;
    headline: string;
    headlineAccent: string | null;
    subhead: string | null;
    investmentRange: string | null;
    contentJson: TiptapDoc | null;
  };

  voucherMeta?: {
    voucherNumber: string | null;
    dateReceived: string;
    paymentMethod: string | null;
    bankReference: string | null;
    currency: string;
    fxRate: string | null;
    amount: number;
    amountInWords: string | null;
    allocations: AllocationRow[];
    openingBalance: number;
    closingBalance: number;
    notes: string | null;
  };

  lpoMeta?: {
    lpoNumber: string | null;
    lpoAmount: number | null;
    lpoValidityDate: string | null;
    lpoReferenceNumber: string | null;
    sourceQuoteNumber: string | null;
    sourceQuoteTitle: string | null;
    currency: string;
    discountValue: number;
    discountType: "percent" | "flat";
    paymentTerms: string | null;
  };

  /** CSS variant class applied to the sheet wrapper: "sheet--mono" | "sheet--brand" | "sheet--serif" */
  themeVariant?: string;
};

function NotImplementedSheet({ label }: { label: string }) {
  return (
    <DocumentSheet>
      <div style={{ padding: 32, color: "#54585F", fontSize: 13 }}>
        {label} sheet data not provided.
      </div>
    </DocumentSheet>
  );
}

export function DocumentSheetRouter({
  document,
  variableContext,
  lineItems,
  invoiceMeta,
  quoteMeta,
  proposalMeta,
  voucherMeta,
  lpoMeta,
  themeVariant,
}: DocumentSheetRouterProps) {
  const type = document.type;

  if (type === "invoice") {
    return (
      <InvoiceSheet
        variableContext={variableContext}
        lineItems={lineItems}
        invoiceNumber={document.invoice_number}
        issuedDate={formatSheetDate(document.created_at)}
        status={document.status}
        dueDate={invoiceMeta?.dueDate ?? null}
        paymentTerms={invoiceMeta?.paymentTerms ?? null}
        currency={invoiceMeta?.currency ?? "USD"}
        discountValue={invoiceMeta?.discountValue ?? 0}
        discountType={invoiceMeta?.discountType ?? "percent"}
        notesFooter={invoiceMeta?.notesFooter ?? null}
        taxMode={document.tax_mode}
        taxRate={document.tax_rate}
        tdsEnabled={document.tds_enabled}
        tdsRate={document.tds_rate}
        variant={themeVariant}
      />
    );
  }

  if (type === "quote") {
    return (
      <QuoteSheet
        variableContext={variableContext}
        lineItems={lineItems}
        quoteNumber={document.quote_number}
        issuedDate={formatSheetDate(document.created_at)}
        status={document.status}
        version={quoteMeta?.version ?? null}
        validUntil={quoteMeta?.validUntil ?? null}
        currency={quoteMeta?.currency ?? "USD"}
        discountValue={quoteMeta?.discountValue ?? 0}
        discountType={quoteMeta?.discountType ?? "percent"}
        notesFooter={quoteMeta?.notesFooter ?? null}
        terms={quoteMeta?.terms ?? []}
        estimatedStart={quoteMeta?.estimatedStart ?? null}
        duration={quoteMeta?.duration ?? null}
        teamDescription={quoteMeta?.teamDescription ?? null}
        taxMode={document.tax_mode}
        taxRate={document.tax_rate}
        variant={themeVariant}
      />
    );
  }

  if (type === "proposal") {
    if (!proposalMeta) {
      return <NotImplementedSheet label="Proposal" />;
    }

    const proposalNumber = document.proposal_number ?? "P-001";
    const clientName =
      variableContext.client?.company ?? variableContext.client?.name ?? null;
    const projectName = variableContext.project?.title ?? null;
    const preparedByName =
      variableContext.sender?.name ??
      variableContext.brand?.business_name ??
      null;

    return (
      <ProposalDocumentClient
        variableContext={variableContext}
        proposalNumber={proposalNumber}
        version={proposalMeta.version}
        headline={proposalMeta.headline}
        headlineAccent={proposalMeta.headlineAccent}
        subhead={proposalMeta.subhead}
        clientName={clientName}
        projectName={projectName}
        investmentRange={proposalMeta.investmentRange}
        preparedByName={preparedByName}
        issuedDate={formatSheetDate(document.created_at)}
        contentJson={proposalMeta.contentJson}
      />
    );
  }

  if (type === "receipt") {
    if (!voucherMeta) {
      return <NotImplementedSheet label="Receipt" />;
    }

    return (
      <ReceiptSheet
        variableContext={variableContext}
        voucherNumber={voucherMeta.voucherNumber}
        dateReceived={voucherMeta.dateReceived}
        paymentMethod={voucherMeta.paymentMethod}
        bankReference={voucherMeta.bankReference}
        currency={voucherMeta.currency}
        fxRate={voucherMeta.fxRate}
        amount={voucherMeta.amount}
        amountInWords={voucherMeta.amountInWords}
        allocations={voucherMeta.allocations}
        openingBalance={voucherMeta.openingBalance}
        closingBalance={voucherMeta.closingBalance}
        notes={voucherMeta.notes}
      />
    );
  }

  if (type === "local_purchase_order") {
    return (
      <LpoSheet
        variableContext={variableContext}
        lineItems={lineItems}
        lpoNumber={lpoMeta?.lpoNumber ?? document.lpo_number}
        issuedDate={formatSheetDate(document.created_at)}
        validUntil={lpoMeta?.lpoValidityDate ?? document.lpo_validity_date}
        currency={lpoMeta?.currency ?? document.currency ?? "USD"}
        status={document.status}
        lpoAmount={
          lpoMeta?.lpoAmount ??
          (document.lpo_amount != null ? Number(document.lpo_amount) : null)
        }
        lpoReferenceNumber={lpoMeta?.lpoReferenceNumber ?? document.lpo_reference_number}
        sourceQuoteNumber={lpoMeta?.sourceQuoteNumber ?? null}
        sourceQuoteTitle={lpoMeta?.sourceQuoteTitle ?? null}
        paymentTerms={lpoMeta?.paymentTerms ?? document.payment_terms}
        discountValue={lpoMeta?.discountValue ?? document.discount_value ?? 0}
        discountType={lpoMeta?.discountType ?? document.discount_type ?? "percent"}
        taxMode={document.tax_mode}
        taxRate={document.tax_rate}
        variant={themeVariant}
      />
    );
  }

  if (type === "statement") {
    return <NotImplementedSheet label="Statement" />;
  }

  if (type === "credit_note") {
    return <NotImplementedSheet label="Credit note" />;
  }

  if (type === "delivery_note") {
    return <NotImplementedSheet label="Delivery note" />;
  }

  // "other" — no structured layout
  return (
    <DocumentSheet>
      <div style={{ padding: 32, color: "#54585F", fontSize: 13 }}>
        This document type does not have a structured layout.
      </div>
    </DocumentSheet>
  );
}
