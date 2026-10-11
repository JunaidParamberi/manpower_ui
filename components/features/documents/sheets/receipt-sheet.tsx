"use client";

import type { VariableContext } from "@/lib/documents/variables";
import { DocumentPageBody } from "./document-page-body";
import { DocBrandmark } from "./doc-brandmark";
import { formatSheetAmount, formatSheetCurrency } from "./types";

export type AllocationRow = {
  documentId: string;
  projectTitle: string | null;
  issuedDate: string;
  invoiceTotal: number;
  applied: number;
  balance: number;
};

type ReceiptSheetProps = {
  variableContext: VariableContext;
  voucherNumber: string | null;
  dateReceived: string; // pre-formatted "14 May 2026"
  paymentMethod: string | null;
  bankReference: string | null;
  currency: string;
  fxRate: string | null; // e.g. "1 GBP = 4.6121 AED"
  amount: number;
  amountInWords: string | null;
  allocations: AllocationRow[];
  openingBalance: number;
  closingBalance: number;
  notes: string | null;
};

export function ReceiptSheet({
  variableContext,
  voucherNumber,
  dateReceived,
  paymentMethod,
  bankReference,
  currency,
  fxRate,
  amount,
  amountInWords,
  allocations,
  openingBalance,
  closingBalance,
  notes,
}: ReceiptSheetProps) {
  const { brand, sender, client } = variableContext;

  const orgName =
    brand?.business_name ?? sender?.company_name ?? null;
  const vatLine = sender?.vat_number ? `TRN ${sender.vat_number}` : null;

  const clientCompany =
    client?.company ?? client?.name ?? null;
  const clientContactLine = [
    client?.contact_name ?? null,
    client?.email ?? null,
    client?.address ?? null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <DocumentPageBody
      accentColor={brand?.primary_color ?? null}
      markerLeft="This document is a system-generated receipt — no signature required for validity."
      pageLabel={(pageNum, total) =>
        voucherNumber
          ? `${voucherNumber} · Page ${pageNum} of ${total}`
          : `Page ${pageNum} of ${total}`
      }
      headerSlot={
        <>
          <div className="voucher-band">
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <DocBrandmark
                logoUrl={brand?.logo_url ?? null}
                businessName={orgName}
                inverted
                primaryColor={brand?.primary_color ?? null}
              />
              <div>
                <div className="doc-header__org">{orgName ?? "Your Business"}</div>
                {vatLine && <div className="doc-header__meta">{vatLine}</div>}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="doc-type">Receipt</div>
              {voucherNumber && (
                <div className="doc-type-sub">{voucherNumber}</div>
              )}
            </div>
          </div>

          <div className="stamp">
            PAID
            <span className="stamp__sub">{dateReceived.toUpperCase()}</span>
          </div>

          <div className="parties" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <div className="party__label">Received from</div>
              <div className="party__name">{clientCompany ?? "—"}</div>
              {clientContactLine && (
                <div className="party__line" style={{ whiteSpace: "pre-line" }}>
                  {clientContactLine}
                </div>
              )}
            </div>
            <div>
              <div className="party__label">Payment details</div>
              <div className="details-grid">
                <div className="row">
                  <span className="dim">Date received</span>
                  <span className="tabular" style={{ fontWeight: 500 }}>
                    {dateReceived}
                  </span>
                </div>
                {paymentMethod && (
                  <div className="row">
                    <span className="dim">Method</span>
                    <span>{paymentMethod}</span>
                  </div>
                )}
                {bankReference && (
                  <div className="row">
                    <span className="dim">Bank reference</span>
                    <span className="mono">{bankReference}</span>
                  </div>
                )}
                <div className="row">
                  <span className="dim">Currency</span>
                  <span>{currency}</span>
                </div>
                {fxRate && (
                  <div className="row">
                    <span className="dim">FX rate</span>
                    <span className="tabular">{fxRate}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bigamount">
            <div>
              <div className="label">Amount received</div>
              {amountInWords && <div className="words">{amountInWords}</div>}
            </div>
            <div className="value">{formatSheetCurrency(amount, currency)}</div>
          </div>
        </>
      }
    >
      {/* Allocations table */}
      <div className="party__label" style={{ marginBottom: 8 }}>
        Allocated to
      </div>
      <table className="allocations">
        <thead>
          <tr>
            <th>Document</th>
            <th>Project</th>
            <th>Issued</th>
            <th className="r">Invoice total</th>
            <th className="r">Applied</th>
            <th className="r">Balance</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((row) => (
            <tr key={row.documentId}>
              <td>{row.documentId}</td>
              <td>{row.projectTitle ?? "—"}</td>
              <td>{row.issuedDate}</td>
              <td className="r tabular">{formatSheetAmount(row.invoiceTotal)}</td>
              <td className="r tabular" style={{ color: "#1F8A52", fontWeight: 500 }}>{formatSheetAmount(row.applied)}</td>
              <td className="r tabular">{formatSheetAmount(row.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Ledger + Notes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
          marginBottom: 32,
        }}
      >
        <div>
          <div className="party__label" style={{ marginBottom: 8 }}>
            Account ledger
          </div>
          <div
            style={{
              background: "#FBFBF9",
              border: "1px solid #ECECE7",
              borderRadius: 10,
              padding: "14px 16px",
              fontSize: 12.5,
            }}
          >
            <div className="pay-line">
              <span className="dim">Opening balance</span>
              <span className="v tabular">{formatSheetAmount(openingBalance)}</span>
            </div>
            <div className="pay-line">
              <span className="dim">This payment</span>
              <span className="v tabular" style={{ color: "#1F8A52" }}>
                −{formatSheetAmount(amount)}
              </span>
            </div>
            <div
              className="pay-line"
              style={{
                borderTop: "1px solid #ECECE7",
                marginTop: 4,
                paddingTop: 8,
                fontWeight: 500,
              }}
            >
              <span>Closing balance</span>
              <span className="v tabular">{formatSheetAmount(closingBalance)}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="party__label" style={{ marginBottom: 8 }}>
            Notes
          </div>
          {notes && (
            <div style={{ fontSize: 12, color: "#54585F", lineHeight: 1.6 }}>
              {notes}
            </div>
          )}
        </div>
      </div>

    </DocumentPageBody>
  );
}
