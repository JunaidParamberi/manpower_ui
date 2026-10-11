import type { VariableContext } from "@/lib/documents/variables";
import { computeLpoSheetTotals } from "@/lib/documents/lpo/sheet-totals";
import type { TaxMode } from "@/lib/documents/tax/compute-tax";
import type { LineItemRow } from "@/types";
import { DocHeader } from "./doc-header";
import { DocLineItems } from "./doc-line-items";
import { DocParties } from "./doc-parties";
import { DocumentPageBody } from "./document-page-body";
import {
  formatSheetAmount,
  formatSheetCurrency,
  formatSheetDate,
} from "./types";
import { toLpoSheetStatus } from "./sheet-status";

type LpoSheetProps = {
  variableContext: VariableContext;
  lineItems: LineItemRow[];
  lpoNumber: string | null;
  issuedDate: string;
  validUntil: string | null;
  currency: string;
  status: string | null;
  lpoAmount: number | null;
  lpoReferenceNumber?: string | null;
  sourceQuoteNumber?: string | null;
  sourceQuoteTitle?: string | null;
  paymentTerms?: string | null;
  discountValue?: number;
  discountType?: "percent" | "flat";
  taxMode?: TaxMode;
  taxRate?: number;
  variant?: string;
};

function LpoTotals({
  totals,
  currency,
}: {
  totals: ReturnType<typeof computeLpoSheetTotals>;
  currency: string;
}) {
  return (
    <div className="totals">
      <div className="totals__inner">
        <div className="row">
          <span className="dim">Subtotal</span>
          <span className="tabular">{formatSheetAmount(totals.subtotal)}</span>
        </div>
        {totals.discount > 0 && totals.discountLabel ? (
          <div className="row">
            <span className="dim">{totals.discountLabel}</span>
            <span className="tabular">-{formatSheetAmount(totals.discount)}</span>
          </div>
        ) : null}
        {totals.tax > 0 && totals.taxLabel ? (
          <div className="row">
            <span className="dim">{totals.taxLabel}</span>
            <span className="tabular">{formatSheetAmount(totals.tax)}</span>
          </div>
        ) : null}
        {totals.capAdjustment !== 0 ? (
          <div className="row">
            <span className="dim">Rounding to PO cap</span>
            <span className="tabular">{formatSheetAmount(totals.capAdjustment)}</span>
          </div>
        ) : null}
        <div className="row grand">
          <span>Authorised total</span>
          <span className="tabular">{formatSheetCurrency(totals.authorisedTotal, currency)}</span>
        </div>
      </div>
    </div>
  );
}

export function LpoSheet({
  variableContext,
  lineItems,
  lpoNumber,
  issuedDate,
  validUntil,
  currency,
  status,
  lpoAmount,
  lpoReferenceNumber,
  sourceQuoteNumber,
  sourceQuoteTitle,
  paymentTerms,
  discountValue = 0,
  discountType = "percent",
  taxMode = "none",
  taxRate = 0,
  variant,
}: LpoSheetProps) {
  const { brand, sender, client, project } = variableContext;
  const sheetStatus = toLpoSheetStatus(status);
  const orgName = brand?.business_name ?? sender?.company_name ?? null;
  const vatLine = sender?.vat_number ? `TRN ${sender.vat_number}` : null;
  const totals = computeLpoSheetTotals({
    lineItems,
    discountValue,
    discountType,
    lpoAmount,
    taxMode,
    taxRate,
  });
  const sourceQuoteLabel = sourceQuoteNumber ?? sourceQuoteTitle ?? null;
  const referenceForInvoices = lpoNumber ?? lpoReferenceNumber ?? "this purchase order";

  const sheetItems = lineItems.map((item) => ({
    id: item.id,
    description: item.description ?? "",
    subDescription: null,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    taxRate: Number(item.tax_rate ?? 0),
    isOptional: false,
  }));

  const issuedToLines = [
    client?.contact_name ? `Attn: ${client.contact_name}` : null,
    client?.address ?? null,
    client?.phone ?? null,
  ].filter(Boolean) as string[];

  const projectLines = [
    sourceQuoteLabel ? `Against quote ${sourceQuoteLabel}` : null,
  ].filter(Boolean) as string[];

  const authorisationCopy = sourceQuoteLabel
    ? `Approved spend against quote ${sourceQuoteLabel} for the work below. All invoices must reference ${referenceForInvoices} and may not exceed the authorised total without a revised PO.`
    : `Approved spend for the work below. All invoices must reference ${referenceForInvoices} and may not exceed the authorised total without a revised PO.`;

  return (
    <DocumentPageBody
      variant={variant}
      accentColor={brand?.primary_color ?? null}
      markerLeft={[orgName, vatLine].filter(Boolean).join(" · ") || ""}
      headerSlot={
        <>
          <DocHeader
            brand={
              brand
                ? {
                    logoUrl: brand.logo_url,
                    businessName: brand.business_name,
                    primaryColor: brand.primary_color,
                    email: null,
                    phone: null,
                    addressLine1: null,
                    addressLine2: null,
                    city: null,
                    vatNumber: null,
                  }
                : null
            }
            sender={
              sender
                ? {
                    name: sender.name,
                    companyName: sender.company_name,
                    email: sender.email,
                    addressLine1: sender.address_line1,
                    addressLine2: sender.address_line2,
                    city: sender.city,
                    region: sender.region,
                    postalCode: sender.postal_code,
                    country: sender.country,
                    vatNumber: sender.vat_number,
                  }
                : null
            }
            docType="Purchase order"
            docNumber={lpoNumber}
            docNumberSub={lpoReferenceNumber ? `· ${lpoReferenceNumber}` : null}
            status={sheetStatus.label}
            statusVariant={sheetStatus.variant}
          />

          <DocParties
            layout="3col"
            columns={[
              {
                label: "Issued to (supplier)",
                name: client?.company ?? client?.name ?? null,
                lines: issuedToLines,
              },
              {
                label: "Project & engagement",
                name: project?.title ?? null,
                lines: projectLines,
              },
              {
                label: "Details",
                detailsGrid: [
                  { label: "Raised", value: issuedDate },
                  { label: "Valid until", value: validUntil ? formatSheetDate(validUntil) : "—", bold: Boolean(validUntil) },
                  { label: "Terms", value: paymentTerms ?? "—" },
                  { label: "Currency", value: currency, mono: true },
                ],
              },
            ]}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 0.8fr",
              gap: 24,
              alignItems: "center",
              border: "1px solid #ECECE7",
              borderRadius: 12,
              padding: "18px 24px",
              marginBottom: 30,
            }}
          >
            <div>
              <div className="party__label">What this order authorises</div>
              <div style={{ color: "#54585F", fontSize: 12.5, lineHeight: 1.55 }}>
                {authorisationCopy}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="party__label">Authorised total</div>
              <div
                style={{
                  fontFamily: "Chillax, Inter, sans-serif",
                  fontSize: 30,
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  color: "#14161A",
                  lineHeight: 1.05,
                }}
              >
                {formatSheetCurrency(totals.authorisedTotal, currency)}
              </div>
            </div>
          </div>
        </>
      }
    >
      <div className="party__label" style={{ marginBottom: 10 }}>
        Ordered items
      </div>
      <DocLineItems items={sheetItems} descHeader="Description" amountHeader="Amount" />
      <LpoTotals totals={totals} currency={currency} />
    </DocumentPageBody>
  );
}
