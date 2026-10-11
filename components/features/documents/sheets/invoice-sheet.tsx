import type { VariableContext } from "@/lib/documents/variables";
import type { LineItemRow } from "@/types";
import type { TaxMode } from "@/lib/documents/tax/compute-tax";
import { DocHeader } from "./doc-header";
import { DocParties } from "./doc-parties";
import { DocLineItems } from "./doc-line-items";
import { DocTotals } from "./doc-totals";
import { DocFooter } from "./doc-footer";
import { DocStatusPill } from "./doc-status-pill";
import { DocumentPageBody } from "./document-page-body";
import type { SheetPaymentInstruction } from "./types";
import { computeSheetTotals, formatSheetDate } from "./types";
import { toInvoiceSheetStatus } from "./sheet-status";

type InvoiceSheetProps = {
  variableContext: VariableContext;
  lineItems: LineItemRow[];
  invoiceNumber: string | null;
  issuedDate: string;
  dueDate: string | null;
  paymentTerms: string | null;
  currency: string;
  status: string | null;
  discountValue?: number;
  discountType?: "percent" | "flat";
  taxMode?: TaxMode;
  taxRate?: number;
  notesFooter?: string | null;
  paymentInstructions?: SheetPaymentInstruction[];
  payOnlineUrl?: string | null;
  tdsEnabled?: boolean;
  tdsRate?: number;
  /** Theme variant: "sheet--mono" | "sheet--brand" | "sheet--serif" */
  variant?: string;
};

export function InvoiceSheet({
  variableContext,
  lineItems,
  invoiceNumber,
  issuedDate,
  dueDate,
  paymentTerms,
  currency,
  status,
  discountValue = 0,
  discountType = "percent",
  taxMode = "none",
  taxRate = 0,
  notesFooter,
  paymentInstructions = [],
  payOnlineUrl,
  tdsEnabled = false,
  tdsRate = 0,
  variant,
}: InvoiceSheetProps) {
  const { brand, sender, client, project } = variableContext;
  const sheetStatus = toInvoiceSheetStatus(status);

  const sheetItems = lineItems.map((item) => ({
    id: item.id,
    description: item.description ?? "",
    subDescription: null,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    taxRate: Number(item.tax_rate ?? 0),
    isOptional: false,
    hsnSac: item.hsn_sac_code ?? null,
  }));

  const totals = computeSheetTotals(sheetItems, discountValue, discountType, taxMode, taxRate, tdsEnabled, tdsRate);

  const orgName = brand?.business_name ?? sender?.company_name ?? null;
  const vatLine = sender?.vat_number ? `TRN ${sender.vat_number}` : null;

  const billedToLines = [
    client?.contact_name ?? null,
    client?.address ?? null,
    client?.email ?? null,
    client?.phone ?? null,
  ].filter(Boolean) as string[];

  const projectLines = [
    project?.title ?? null,
  ].filter(Boolean) as string[];

  const detailsGrid = [
    { label: "Issued", value: issuedDate },
    ...(dueDate ? [{ label: "Due", value: formatSheetDate(dueDate), bold: true }] : []),
    ...(paymentTerms ? [{ label: "Terms", value: paymentTerms }] : []),
    { label: "Currency", value: currency },
  ];

  const pageLeft = [orgName, vatLine].filter(Boolean).join(" · ") || "";

  return (
    <DocumentPageBody
      variant={variant}
      accentColor={brand?.primary_color ?? null}
      markerLeft={pageLeft}
      headerSlot={
        <>
          <DocHeader
            brand={brand ? {
              logoUrl: brand.logo_url,
              businessName: brand.business_name,
              primaryColor: brand.primary_color,
              email: null,
              phone: null,
              addressLine1: null,
              addressLine2: null,
              city: null,
              vatNumber: null,
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
            docType="Invoice"
            docNumber={invoiceNumber}
            status={sheetStatus.label}
            statusVariant={sheetStatus.variant}
          />

          <DocParties
            layout="3col"
            columns={[
              {
                label: "Billed to",
                name: client?.company ?? client?.name ?? null,
                lines: billedToLines,
              },
              {
                label: "Project",
                name: project?.title ?? null,
                lines: projectLines.slice(1),
              },
              {
                label: "Details",
                detailsGrid,
              },
            ]}
          />
        </>
      }
    >
      <DocLineItems items={sheetItems} descHeader="Description" amountHeader="Amount" />

      <DocTotals
        totals={totals}
        currency={currency}
        grandLabel={`Total due (${currency})`}
      />

      <DocFooter
        leftTitle="Payment instructions"
        paymentInstructions={paymentInstructions}
        rightTitle="Notes"
        rightContent={
          <>
            {notesFooter && <div style={{ fontSize: 12, color: "#54585F", lineHeight: 1.6 }}>{notesFooter}</div>}
            {payOnlineUrl && (
              <div style={{ marginTop: 14 }}>
                <DocStatusPill label={`Pay online · ${payOnlineUrl}`} variant="success" dot />
              </div>
            )}
          </>
        }
      />
    </DocumentPageBody>
  );
}
