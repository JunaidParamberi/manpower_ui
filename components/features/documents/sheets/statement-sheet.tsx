import type { VariableContext } from "@/lib/documents/variables";
import type { SheetPaymentInstruction } from "./types";
import { formatSheetAmount, formatSheetCurrency } from "./types";
import { DocumentSheet } from "./document-sheet";
import { DocHeader } from "./doc-header";
import { DocParties } from "./doc-parties";
import { DocFooter } from "./doc-footer";
import { DocPageMarker } from "./doc-page-marker";

type AgingBucket = {
  current: number;   // 0–30 days (inclusive of today)
  days1to30: number;
  days31to60: number;
  days60plus: number;
};

type TransactionRow = {
  date: string;               // pre-formatted "01 Apr"
  reference: string | null;   // e.g. "INV-2046" or "—"
  description: string;
  charge: number | null;      // null = show "—"
  credit: number | null;      // null = show "—"
  balance: number;
  isCredit?: boolean;         // true = show credit value in green
  isClosingRow?: boolean;     // true = highlighted background row
};

type StatementSheetProps = {
  variableContext: VariableContext;
  statementNumber: string | null;
  periodLabel: string;        // e.g. "01 Apr — 14 May 2026"
  issuedDate: string;         // pre-formatted
  currency: string;
  accountManager: string | null;
  openingBalance: number;
  totalInvoiced: number;
  totalReceived: number;
  closingBalance: number;
  aging: AgingBucket;
  transactions: TransactionRow[];
  paymentInstructions: SheetPaymentInstruction[];
  actionRequiredNote: string | null;
};

function computeAgingPercentages(aging: AgingBucket): {
  current: number;
  days1to30: number;
  days31to60: number;
  days60plus: number;
} {
  const total = aging.current + aging.days1to30 + aging.days31to60 + aging.days60plus;
  if (total === 0) {
    return { current: 25, days1to30: 25, days31to60: 25, days60plus: 25 };
  }
  return {
    current: (aging.current / total) * 100,
    days1to30: (aging.days1to30 / total) * 100,
    days31to60: (aging.days31to60 / total) * 100,
    days60plus: (aging.days60plus / total) * 100,
  };
}

function formatAgingValue(amount: number, currency: string): string {
  if (amount === 0) return "0";
  return formatSheetCurrency(amount, currency);
}

export function StatementSheet({
  variableContext,
  statementNumber,
  periodLabel,
  issuedDate,
  currency,
  accountManager,
  openingBalance,
  totalInvoiced,
  totalReceived,
  closingBalance,
  aging,
  transactions,
  paymentInstructions,
  actionRequiredNote,
}: StatementSheetProps) {
  const { brand, sender, client } = variableContext;

  const agingPct = computeAgingPercentages(aging);

  const clientName = client?.company ?? client?.name ?? null;
  const clientLines = [
    client?.contact_name ? `${client.contact_name} · ${client.email ?? ""}` : client?.email ?? null,
    client?.address ?? null,
  ].filter(Boolean) as string[];

  const detailsGrid = [
    { label: "Period", value: periodLabel },
    { label: "Issued", value: issuedDate },
    { label: "Currency", value: currency },
    ...(accountManager ? [{ label: "Account manager", value: accountManager }] : []),
  ];

  const docNumberSub = statementNumber ? `· ${periodLabel}` : periodLabel;

  return (
    <DocumentSheet>
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
        docType="Statement"
        docNumber={statementNumber}
        docNumberSub={docNumberSub}
      />

      <DocParties
        layout="2col"
        columns={[
          {
            label: "Account",
            name: clientName,
            lines: clientLines,
          },
          {
            label: "Statement details",
            detailsGrid,
          },
        ]}
      />

      {/* Summary stats */}
      <div className="stat-grid">
        <div className="stat">
          <div className="k">Opening balance</div>
          <div className="v">{formatSheetCurrency(openingBalance, currency)}</div>
        </div>
        <div className="stat">
          <div className="k">Invoiced</div>
          <div className="v">+ {formatSheetAmount(totalInvoiced)}</div>
        </div>
        <div className="stat stat--ok">
          <div className="k">Received</div>
          <div className="v">− {formatSheetAmount(totalReceived)}</div>
        </div>
        <div className="stat">
          <div className="k">Closing balance</div>
          <div className="v">{formatSheetCurrency(closingBalance, currency)}</div>
        </div>
      </div>

      {/* Aging */}
      <div className="party__label" style={{ marginBottom: 8 }}>Aging — outstanding balance</div>
      <div className="aging-bar">
        <span style={{ width: `${agingPct.current}%`, background: "#1F8A52" }} />
        <span style={{ width: `${agingPct.days1to30}%`, background: "#3550E0" }} />
        <span style={{ width: `${agingPct.days31to60}%`, background: "#B36A12" }} />
        <span style={{ width: `${agingPct.days60plus}%`, background: "#C13838" }} />
      </div>
      <div className="aging-legend">
        <div className="item">
          <span className="swatch" style={{ background: "#1F8A52" }} />
          Current · {formatAgingValue(aging.current, currency)}
        </div>
        <div className="item">
          <span className="swatch" style={{ background: "#3550E0" }} />
          1–30d · {formatAgingValue(aging.days1to30, currency)}
        </div>
        <div className="item">
          <span className="swatch" style={{ background: "#B36A12" }} />
          31–60d · {aging.days31to60 > 0 ? <strong>{formatSheetCurrency(aging.days31to60, currency)}</strong> : "0"}
        </div>
        <div className="item">
          <span className="swatch" style={{ background: "#C13838" }} />
          60d+ · {aging.days60plus > 0 ? <strong>{formatSheetCurrency(aging.days60plus, currency)}</strong> : "0"}
        </div>
      </div>

      <div style={{ height: 24 }} />

      {/* Transactions table */}
      <div className="party__label" style={{ marginBottom: 8 }}>Transactions</div>
      <table className="allocations">
        <thead>
          <tr>
            <th>Date</th>
            <th>Reference</th>
            <th>Description</th>
            <th className="r">Charge</th>
            <th className="r">Credit</th>
            <th className="r">Balance</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((row, i) => (
            <tr
              key={i}
              style={
                row.isClosingRow
                  ? { background: "#FBFBF9", fontWeight: 500 }
                  : undefined
              }
            >
              <td>{row.date}</td>
              <td>{row.reference ?? "—"}</td>
              <td>{row.description}</td>
              <td>
                {row.charge !== null ? (
                  <span className="r tabular">{formatSheetAmount(row.charge)}</span>
                ) : (
                  <span className="r tabular dim">—</span>
                )}
              </td>
              <td>
                {row.credit !== null ? (
                  <span
                    className="r tabular"
                    style={row.isCredit ? { color: "#1F8A52" } : undefined}
                  >
                    {formatSheetAmount(row.credit)}
                  </span>
                ) : (
                  <span className="r tabular dim">—</span>
                )}
              </td>
              <td>
                <span
                  className="r tabular"
                  style={row.isClosingRow ? { fontWeight: 600 } : undefined}
                >
                  {formatSheetAmount(row.balance)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <DocFooter
        leftTitle={closingBalance > 0 ? "Action required" : "No balance due"}
        leftContent={
          actionRequiredNote ? (
            <div style={{ fontSize: 12, color: "#54585F", lineHeight: 1.6, marginTop: 6 }}>
              {actionRequiredNote}
            </div>
          ) : undefined
        }
        rightTitle="How to pay"
        paymentInstructions={paymentInstructions}
      />

      <DocPageMarker
        left="Statement is informational — not a tax invoice."
        right={`${statementNumber ?? "SOA"} · Page 1 of 1`}
      />
    </DocumentSheet>
  );
}
