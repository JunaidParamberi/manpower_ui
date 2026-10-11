import type { VariableContext } from "@/lib/documents/variables";
import type { LineItemRow } from "@/types";
import { DocumentSheet } from "./document-sheet";
import { DocBrandmark } from "./doc-brandmark";
import { DocParties } from "./doc-parties";
import { DocFooter } from "./doc-footer";
import { DocPageMarker } from "./doc-page-marker";
import { computeSheetTotals, formatSheetAmount } from "./types";

type CreditNoteSheetProps = {
  variableContext: VariableContext;
  creditNoteNumber: string | null;
  againstInvoiceNumber: string | null;
  issuedDate: string; // pre-formatted "14 May 2026"
  reason: string | null;
  currency: string;
  originalInvoiceAmount: number;
  lineItems: LineItemRow[];
  discountValue?: number;
  discountType?: "percent" | "flat";
  appliedAsMethod: string | null;
  appliedAsStatus: string | null;
  appliedAsAlternative: string | null;
  notesFooter: string | null;
};

export function CreditNoteSheet({
  variableContext,
  creditNoteNumber,
  againstInvoiceNumber,
  issuedDate,
  reason,
  currency,
  originalInvoiceAmount,
  lineItems,
  discountValue = 0,
  discountType = "percent",
  appliedAsMethod,
  appliedAsStatus,
  appliedAsAlternative,
  notesFooter,
}: CreditNoteSheetProps) {
  const { brand, sender, client } = variableContext;

  const orgName = brand?.business_name ?? sender?.company_name ?? null;
  const vatLine = sender?.vat_number ? `TRN ${sender.vat_number}` : null;

  const sheetItems = lineItems.map((item) => ({
    id: item.id,
    description: item.description ?? "",
    subDescription: null,
    quantity: Number(item.quantity),
    unitPrice: Number(item.unit_price),
    taxRate: Number(item.tax_rate ?? 0),
    isOptional: false,
  }));

  const totals = computeSheetTotals(sheetItems, discountValue, discountType);

  const clientName = client?.company ?? client?.name ?? null;
  const clientLines = [
    client?.contact_name ?? null,
    client?.email ?? null,
    client?.address ?? null,
  ].filter(Boolean) as string[];

  const detailsGrid = [
    { label: "Issued", value: issuedDate },
    ...(againstInvoiceNumber
      ? [{ label: "Original invoice", value: againstInvoiceNumber, mono: true }]
      : []),
    ...(reason ? [{ label: "Reason", value: reason }] : []),
    { label: "Currency", value: currency },
  ];

  // Build "Applied as" left content
  const appliedAsLines = [
    appliedAsMethod ?? null,
    appliedAsStatus ?? null,
    appliedAsAlternative ?? null,
  ].filter(Boolean) as string[];

  return (
    <DocumentSheet>
      {/* Credit band — custom red-tinted header replacing DocHeader */}
      <div className="credit-band">
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <DocBrandmark
            logoUrl={brand?.logo_url ?? null}
            businessName={orgName}
          />
          <div>
            <div className="doc-header__org">{orgName ?? "Your Business"}</div>
            {vatLine && (
              <div
                className="doc-header__meta"
                style={{ color: "#8E2828", opacity: 0.7 }}
              >
                {vatLine}
              </div>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="doc-type">Credit note</div>
          {(creditNoteNumber || againstInvoiceNumber) && (
            <div className="doc-type-sub">
              {[
                creditNoteNumber,
                againstInvoiceNumber ? `against ${againstInvoiceNumber}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}
        </div>
      </div>

      {/* 2-col parties: Issued to | Details */}
      <DocParties
        layout="2col"
        columns={[
          {
            label: "Issued to",
            name: clientName,
            lines: clientLines,
          },
          {
            label: "Details",
            detailsGrid,
          },
        ]}
      />

      {/* Refund card */}
      <div className="refund-card">
        <div>
          <div className="k">Original invoice</div>
          <div className="v">{formatSheetAmount(originalInvoiceAmount)}</div>
        </div>
        <div className="arrow">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="k">Credited</div>
          <div className="v" style={{ color: "#C13838" }}>
            − {formatSheetAmount(totals.total)}
          </div>
        </div>
      </div>

      {/* Items credited */}
      <div className="party__label" style={{ marginBottom: 8 }}>
        Items credited
      </div>
      <table className="items">
        <thead>
          <tr>
            <th>Description</th>
            <th className="r">Qty</th>
            <th className="r">Rate</th>
            <th className="r">Credit</th>
          </tr>
        </thead>
        <tbody>
          {sheetItems.map((item) => (
            <tr key={item.id}>
              <td>
                <span className="desc-title">{item.description}</span>
              </td>
              <td className="qty">{item.quantity}</td>
              <td className="rate">{formatSheetAmount(item.unitPrice)}</td>
              <td className="total" style={{ color: "#C13838" }}>
                −{formatSheetAmount(item.quantity * item.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals — rendered inline so all values carry "−" prefix */}
      <div className="totals">
        <div className="totals__inner">
          <div className="row">
            <span className="dim">Subtotal credit</span>
            <span className="tabular">−{formatSheetAmount(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && totals.discountLabel && (
            <div className="row">
              <span className="dim">{totals.discountLabel}</span>
              <span className="tabular">−{formatSheetAmount(totals.discount)}</span>
            </div>
          )}
          {totals.tax > 0 && totals.taxLabel && (
            <div className="row">
              <span className="dim">{totals.taxLabel}</span>
              <span className="tabular">−{formatSheetAmount(totals.tax)}</span>
            </div>
          )}
          <div className="row grand" style={{ color: "#C13838" }}>
            <span>Total credit ({currency})</span>
            <span className="tabular">−{formatSheetAmount(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer: Applied as | Notes */}
      <DocFooter
        leftTitle="Applied as"
        leftContent={
          appliedAsLines.length > 0 ? (
            <div style={{ fontSize: 12, color: "#54585F", lineHeight: 1.6 }}>
              {appliedAsLines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          ) : undefined
        }
        rightTitle="Notes"
        rightContent={
          notesFooter ? (
            <div style={{ fontSize: 12, color: "#54585F", lineHeight: 1.6 }}>
              {notesFooter}
            </div>
          ) : undefined
        }
      />

      {/* Page marker */}
      <DocPageMarker
        left="Credit notes are a tax document. Please retain for your records."
        right={
          creditNoteNumber
            ? `${creditNoteNumber} · Page 1 of 1`
            : "Page 1 of 1"
        }
      />
    </DocumentSheet>
  );
}
