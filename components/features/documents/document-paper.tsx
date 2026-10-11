import { Fragment } from "react";

import { documentTypeLabel } from "@/lib/documents/display";
import type { VariableContext } from "@/lib/documents/variables";
import type {
  DocumentStatus,
  DocumentType,
  LineItemRow,
  TiptapDoc,
} from "@/types";

import { renderNode } from "./document-tiptap-render";
import { DocumentPaperHeader } from "./document-paper-header";
import { DocumentPaperLineItems } from "./document-paper-line-items";
import { DocumentPaperMeta } from "./document-paper-meta";

const C = { ink: "#0f0f0f", muted: "#6b7280" } as const;

const DEFAULT_PRIMARY = "#3550E0";

type DocInput = {
  id?: string;
  type: DocumentType;
  title: string;
  created_at: string;
  status?: DocumentStatus;
  invoice_number?: string | null;
  quote_number?: string | null;
  receipt_number?: string | null;
};

type DocMeta = {
  number?: string | null;
  due_date?: string | null;
  valid_until?: string | null;
  payment_terms?: string | null;
  notes_footer?: string | null;
  lpo_reference_number?: string | null;
  discount_value?: number;
  discount_type?: "percent" | "flat";
};

type VoucherData = {
  receiptNumber: string | null;
  paidAt: string | Date;
  amount: number;
  currency: string;
  method: string;
  reference: string | null;
  notes: string | null;
  invoiceTitle: string;
  invoiceNumber: string | null;
};

type DocumentPaperProps = {
  document: DocInput;
  variableContext: VariableContext;
  lineItems?: LineItemRow[];
  content?: TiptapDoc | null;
  docMeta?: DocMeta;
  voucherData?: VoucherData | null;
  currency?: string;
};

function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(value);
  }
}

function fmtCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function buildDetailRows(
  docType: DocumentType,
  docMeta: DocMeta | undefined,
  voucherData: VoucherData | null | undefined,
): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = [];

  switch (docType) {
    case "invoice":
      if (docMeta?.due_date) rows.push({ label: "Due", value: fmtDate(docMeta.due_date) });
      if (docMeta?.payment_terms) rows.push({ label: "Terms", value: docMeta.payment_terms });
      if (docMeta?.lpo_reference_number)
        rows.push({ label: "LPO Ref", value: docMeta.lpo_reference_number });
      break;

    case "quote":
      if (docMeta?.valid_until)
        rows.push({ label: "Valid until", value: fmtDate(docMeta.valid_until) });
      break;

    case "proposal":
      if (docMeta?.number) rows.push({ label: "Number", value: docMeta.number });
      break;

    case "receipt":
      if (voucherData) {
        rows.push({ label: "Paid on", value: fmtDate(voucherData.paidAt) });
        rows.push({
          label: "Amount",
          value: fmtCurrency(voucherData.amount, voucherData.currency),
        });
        rows.push({ label: "Method", value: voucherData.method });
      }
      break;

    default:
      break;
  }

  return rows;
}

function pickDocNumber(doc: DocInput, docMeta: DocMeta | undefined): string | null {
  return (
    docMeta?.number ??
    doc.invoice_number ??
    doc.quote_number ??
    doc.receipt_number ??
    null
  );
}

export function DocumentPaper({
  document,
  variableContext,
  lineItems = [],
  content,
  docMeta,
  voucherData,
  currency = "USD",
}: DocumentPaperProps) {
  const { brand, sender, client } = variableContext;

  const primaryColor = brand?.primary_color ?? DEFAULT_PRIMARY;
  const businessName = brand?.business_name ?? sender?.company_name ?? null;
  const logoUrl = brand?.logo_url ?? null;

  const issuedDate = fmtDate(document.created_at);
  const detailRows = buildDetailRows(document.type, docMeta, voucherData);
  const docNumber = pickDocNumber(document, docMeta);
  const typeLabel = documentTypeLabel(document.type);

  const hasLineItems = lineItems.length > 0;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/[0.06]">
      {/* Brand accent line */}
      <div style={{ height: 3, background: primaryColor }} />

      {/* Header */}
      <div className="px-8 py-5 border-b border-black/[0.07]">
        <DocumentPaperHeader
          logoUrl={logoUrl}
          businessName={businessName}
          primaryColor={primaryColor}
          docTypeLabel={typeLabel}
          docTitle={document.title}
          docNumber={docNumber}
        />
      </div>

      {/* Meta block */}
      <DocumentPaperMeta
        sender={sender}
        client={client}
        issuedDate={issuedDate}
        detailRows={detailRows}
      />

      {/* Body */}
      <div className="px-8 py-7">
        {(document.type === "invoice" || document.type === "quote") && (
          <DocumentPaperLineItems
            lineItems={lineItems}
            currency={currency}
            discountValue={docMeta?.discount_value}
            discountType={docMeta?.discount_type}
          />
        )}

        {document.type === "proposal" && (
          <>
            {content?.content && content.content.length > 0 && (
              <div className="doc-render mb-6">
                {content.content.map((node, i) => (
                  <Fragment key={i}>{renderNode(node, variableContext)}</Fragment>
                ))}
              </div>
            )}
            {hasLineItems && (
              <DocumentPaperLineItems
                lineItems={lineItems}
                currency={currency}
                discountValue={docMeta?.discount_value}
                discountType={docMeta?.discount_type}
              />
            )}
          </>
        )}

        {document.type === "receipt" && voucherData && (
          <VoucherBody data={voucherData} />
        )}

        {(document.type === "other" ||
          document.type === "local_purchase_order") && (
          <>
            {content?.content && content.content.length > 0 ? (
              <div className="doc-render">
                {content.content.map((node, i) => (
                  <Fragment key={i}>{renderNode(node, variableContext)}</Fragment>
                ))}
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: C.muted }}>
                No content.
              </p>
            )}
          </>
        )}
      </div>

      {/* Notes footer */}
      {docMeta?.notes_footer && (
        <div className="px-8 pb-6 border-t border-black/[0.07] pt-4">
          <p
            className="text-[0.7rem] font-semibold uppercase tracking-widest mb-1"
            style={{ color: "#9ca3af" }}
          >
            Notes
          </p>
          <p className="text-sm whitespace-pre-line" style={{ color: C.muted }}>
            {docMeta.notes_footer}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="px-8 py-3 border-t border-black/[0.07] flex justify-between">
        <span className="text-[0.65rem]" style={{ color: "#9ca3af" }}>
          {businessName}
        </span>
        <span className="text-[0.65rem]" style={{ color: "#9ca3af" }}>
          Thank you for your business
        </span>
      </div>
    </div>
  );
}

// ─── Voucher body sub-component ──────────────────────────────────────────────

function VoucherBody({ data }: { data: VoucherData }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Invoice", value: data.invoiceTitle },
  ];
  if (data.invoiceNumber) rows.push({ label: "Invoice #", value: data.invoiceNumber });
  rows.push({ label: "Date paid", value: fmtDate(data.paidAt) });
  rows.push({
    label: "Amount",
    value: fmtCurrency(data.amount, data.currency),
  });
  rows.push({ label: "Method", value: data.method });
  if (data.reference) rows.push({ label: "Reference", value: data.reference });
  if (data.notes) rows.push({ label: "Notes", value: data.notes });

  return (
    <div className="flex flex-col gap-4">
      {/* Confirmation banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-emerald-700 font-semibold text-sm">
          Payment Confirmed
        </p>
        {data.receiptNumber && (
          <p className="text-emerald-600 text-xs mt-0.5">{data.receiptNumber}</p>
        )}
      </div>

      {/* Details grid */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
        {rows.map(({ label, value }) => (
          <Fragment key={label}>
            <dt
              className="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
              style={{ color: C.muted }}
            >
              {label}
            </dt>
            <dd style={{ color: C.ink }}>{value}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
