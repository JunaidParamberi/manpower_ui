import type { VariableContext } from "@/lib/documents/variables";
import type { LineItemRow } from "@/types";
import type { TaxMode } from "@/lib/documents/tax/compute-tax";
import { DocHeader } from "./doc-header";
import { DocParties } from "./doc-parties";
import { DocLineItems } from "./doc-line-items";
import { DocTotals } from "./doc-totals";
import { DocumentPageBody } from "./document-page-body";
import { computeSheetTotals, formatSheetDate, formatSheetAmount } from "./types";

type QuoteSheetProps = {
  variableContext: VariableContext;
  lineItems: LineItemRow[];
  quoteNumber: string | null;
  version?: number | null;
  issuedDate: string;
  validUntil: string | null;
  currency: string;
  status: string | null;
  discountValue?: number;
  discountType?: "percent" | "flat";
  taxMode?: TaxMode;
  taxRate?: number;
  notesFooter?: string | null;
  terms?: string[];
  estimatedStart?: string | null;
  duration?: string | null;
  teamDescription?: string | null;
  variant?: string;
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function QuoteSheet({
  variableContext,
  lineItems,
  quoteNumber,
  version,
  issuedDate,
  validUntil,
  currency,
  status,
  discountValue = 0,
  discountType = "percent",
  taxMode = "none",
  taxRate = 0,
  notesFooter,
  terms = [],
  estimatedStart,
  duration,
  teamDescription,
  variant,
}: QuoteSheetProps) {
  const { brand, sender, client, project } = variableContext;

  const sheetItems = lineItems.map((item) => ({
    id: item.id,
    description: item.description ?? "",
    subDescription: null,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    taxRate: Number(item.tax_rate ?? 0),
    isOptional: (item as { is_optional?: boolean }).is_optional ?? false,
    hsnSac: item.hsn_sac_code ?? null,
  }));

  const totals = computeSheetTotals(sheetItems, discountValue, discountType, taxMode, taxRate);
  const optionalsTotal = sheetItems
    .filter((i) => i.isOptional)
    .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const days = daysUntil(validUntil);
  const orgName = brand?.business_name ?? sender?.company_name ?? null;
  const vatLine = sender?.vat_number ? `TRN ${sender.vat_number}` : null;

  const projectLines = [
    estimatedStart ? `Estimated start: ${estimatedStart}` : null,
    duration ? `Duration: ${duration}` : null,
    teamDescription ? `Team: ${teamDescription}` : null,
  ].filter(Boolean) as string[];

  const summaryGrid = [
    { label: "Issued", value: issuedDate },
    { label: "Subtotal", value: formatSheetAmount(totals.subtotal) },
    ...(totals.tax > 0 && totals.taxLabel ? [{ label: totals.taxLabel, value: formatSheetAmount(totals.tax) }] : []),
  ];

  return (
    <DocumentPageBody
      variant={variant}
      accentColor={brand?.primary_color ?? null}
      markerLeft={[orgName, vatLine].filter(Boolean).join(" · ") || ""}
      headerSlot={
        <>
          <DocHeader
            brand={brand ? {
              logoUrl: brand.logo_url,
              businessName: brand.business_name,
              primaryColor: brand.primary_color,
              email: null, phone: null, addressLine1: null, addressLine2: null, city: null, vatNumber: null,
            } : null}
            sender={sender ? {
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
            } : null}
            docType="Quote"
            docNumber={quoteNumber}
            docNumberSub={version && version > 1 ? `· v${version}` : null}
            status={status ?? "Draft"}
            statusVariant="default"
          />

          {validUntil && (
            <div className="banner">
              <div className="banner__left">
                <div className="banner__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 500, color: "#7A4A0C" }}>Valid until {formatSheetDate(validUntil)}</div>
                  {days !== null && days > 0 && (
                    <div style={{ color: "#9A6A2E", fontSize: 11.5, marginTop: 1 }}>
                      {days} days · pricing locked at acceptance
                    </div>
                  )}
                </div>
              </div>
              <div className="banner__right" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11.5, color: "#7A4A0C" }}>
                {quoteNumber}
              </div>
            </div>
          )}

          <DocParties
            layout="3col"
            columns={[
              {
                label: "Prepared for",
                name: client?.company ?? client?.name ?? null,
                lines: [
                  client?.contact_name ?? null,
                  client?.email ?? null,
                  client?.address ?? null,
                ].filter(Boolean) as string[],
              },
              {
                label: "Project",
                name: project?.title ?? null,
                lines: projectLines,
              },
              {
                label: "Summary",
                detailsGrid: [
                  ...summaryGrid,
                  { label: `Total ${currency}`, value: formatSheetAmount(totals.total), bold: true },
                ],
              },
            ]}
          />
        </>
      }
    >
      <DocLineItems items={sheetItems} descHeader="Scope" amountHeader="Subtotal" />

      {/* Terms + Totals row */}
      <div className="terms-totals">
        <div>
          <div className="party__label">Terms</div>
          {terms.length > 0 && (
            <ul style={{ paddingLeft: 18, margin: "6px 0 0", color: "#54585F", fontSize: 12, lineHeight: 1.7 }}>
              {terms.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          )}
          {notesFooter && (
            <div style={{ color: "#54585F", fontSize: 12, lineHeight: 1.6, marginTop: 12 }}>
              {notesFooter}
            </div>
          )}
        </div>
        <DocTotals
          totals={{ ...totals, subtotal: totals.total - totals.tax }}
          currency={currency}
          grandLabel={`Total ${currency}`}
          withOptionals={optionalsTotal > 0 ? optionalsTotal : null}
        />
      </div>
    </DocumentPageBody>
  );
}
