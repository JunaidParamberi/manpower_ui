import { computeDocumentTotals } from "@/lib/documents/compute-document-totals";
import { roundMoney } from "@/lib/documents/tax/compute-tax";
import type { LineItemRow } from "@/types";

const C = { ink: "#0f0f0f", muted: "#6b7280" } as const;

type DocumentPaperLineItemsProps = {
  lineItems: LineItemRow[];
  currency: string;
  discountValue?: number;
  discountType?: "percent" | "flat";
  tdsEnabled?: boolean;
  tdsRate?: number;
};

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

function toNum(v: number | string): number {
  return typeof v === "number" ? v : parseFloat(v) || 0;
}

function paperTotals(
  lineItems: LineItemRow[],
  discountValue = 0,
  discountType: "percent" | "flat" = "percent",
  tdsEnabled = false,
  tdsRate = 0,
) {
  const base = computeDocumentTotals(lineItems, discountValue, discountType);
  const tdsAmount =
    tdsEnabled && tdsRate > 0
      ? roundMoney(base.discountedSubtotal * tdsRate / 100)
      : 0;
  const netReceived = roundMoney(base.total - tdsAmount);

  return {
    subtotal: base.subtotal,
    discount: base.discount,
    taxTotal: base.taxTotal,
    discountedSubtotal: base.discountedSubtotal,
    total: base.total,
    tdsAmount,
    netReceived,
  };
}

export function DocumentPaperLineItems({
  lineItems,
  currency,
  discountValue = 0,
  discountType = "percent",
  tdsEnabled = false,
  tdsRate = 0,
}: DocumentPaperLineItemsProps) {
  const hasDiscount = discountValue > 0;
  const { subtotal, discount, taxTotal, total, tdsAmount, netReceived } = paperTotals(
    lineItems,
    discountValue,
    discountType,
    tdsEnabled,
    tdsRate,
  );

  if (lineItems.length === 0) {
    return (
      <p className="text-sm italic" style={{ color: C.muted }}>
        No line items added.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Desktop table */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              {["Description", "Qty", "Unit Price", "Tax %", "Amount"].map(
                (h, i) => (
                  <th
                    key={h}
                    className={`py-2.5 px-3 text-[0.6rem] font-semibold uppercase tracking-[0.18em] ${
                      i === 0 ? "text-left pl-4" : "text-right"
                    } ${i === 4 ? "pr-4" : ""}`}
                    style={{ color: C.muted }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => {
              const amount =
                toNum(item.quantity) * toNum(item.unit_price);
              return (
                <tr key={item.id} className="border-b border-gray-100">
                  <td
                    className="py-2.5 pl-4 pr-3"
                    style={{ color: C.ink }}
                  >
                    {item.description ? (
                      <div className="flex flex-col gap-0.5">
                        <span>{item.description}</span>
                        {item.notes && (
                          <span className="text-xs" style={{ color: C.muted }}>
                            {item.notes}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: C.muted }} className="italic">
                        —
                      </span>
                    )}
                  </td>
                  <td
                    className="py-2.5 px-3 text-right tabular-nums"
                    style={{ color: C.ink }}
                  >
                    {toNum(item.quantity)}
                  </td>
                  <td
                    className="py-2.5 px-3 text-right tabular-nums"
                    style={{ color: C.ink }}
                  >
                    {fmt(toNum(item.unit_price), currency)}
                  </td>
                  <td
                    className="py-2.5 px-3 text-right tabular-nums"
                    style={{ color: C.muted }}
                  >
                    {toNum(item.tax_rate) > 0
                      ? `${toNum(item.tax_rate)}%`
                      : "—"}
                  </td>
                  <td
                    className="py-2.5 pl-3 pr-4 text-right tabular-nums font-medium"
                    style={{ color: C.ink }}
                  >
                    {fmt(amount, currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: card per line item */}
      <div className="sm:hidden flex flex-col gap-3">
        {lineItems.map((item) => {
          const amount = toNum(item.quantity) * toNum(item.unit_price);
          return (
            <div
              key={item.id}
              className="rounded-xl border border-gray-200 p-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm"
            >
              <div className="col-span-2 flex flex-col gap-0.5">
                <span className="font-medium" style={{ color: C.ink }}>
                  {item.description || (
                    <span style={{ color: C.muted }} className="italic">
                      No description
                    </span>
                  )}
                </span>
                {item.notes && (
                  <span className="text-xs" style={{ color: C.muted }}>
                    {item.notes}
                  </span>
                )}
              </div>
              <span style={{ color: C.muted }} className="text-xs">Qty</span>
              <span className="text-right tabular-nums" style={{ color: C.ink }}>
                {toNum(item.quantity)}
              </span>
              <span style={{ color: C.muted }} className="text-xs">Unit price</span>
              <span className="text-right tabular-nums" style={{ color: C.ink }}>
                {fmt(toNum(item.unit_price), currency)}
              </span>
              {toNum(item.tax_rate) > 0 && (
                <>
                  <span style={{ color: C.muted }} className="text-xs">Tax</span>
                  <span className="text-right tabular-nums" style={{ color: C.ink }}>
                    {toNum(item.tax_rate)}%
                  </span>
                </>
              )}
              <span style={{ color: C.muted }} className="text-xs font-medium">Amount</span>
              <span
                className="text-right tabular-nums font-semibold"
                style={{ color: C.ink }}
              >
                {fmt(amount, currency)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="mt-4 flex justify-end">
        <dl className="w-full sm:w-64 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <dt style={{ color: C.muted }}>Subtotal</dt>
            <dd className="tabular-nums" style={{ color: C.ink }}>
              {fmt(subtotal, currency)}
            </dd>
          </div>

          {hasDiscount && (
            <div className="flex justify-between">
              <dt style={{ color: C.muted }}>
                Discount
                {discountType === "percent"
                  ? ` (${discountValue}%)`
                  : ""}
              </dt>
              <dd className="tabular-nums" style={{ color: C.muted }}>
                −{fmt(discount, currency)}
              </dd>
            </div>
          )}

          {taxTotal > 0 && (
            <div className="flex justify-between">
              <dt style={{ color: C.muted }}>Tax</dt>
              <dd className="tabular-nums" style={{ color: C.ink }}>
                {fmt(taxTotal, currency)}
              </dd>
            </div>
          )}

          <div
            className="flex justify-between pt-2 mt-1 border-t border-gray-200 font-semibold"
            style={{ color: C.ink }}
          >
            <dt>Total due</dt>
            <dd className="tabular-nums">{fmt(total, currency)}</dd>
          </div>

          {tdsAmount > 0 && (
            <>
              <div className="flex justify-between">
                <dt style={{ color: C.muted }}>
                  TDS deduction
                  {tdsRate > 0 ? ` (${tdsRate}%)` : ""}
                </dt>
                <dd className="tabular-nums" style={{ color: C.muted }}>
                  −{fmt(tdsAmount, currency)}
                </dd>
              </div>
              <div
                className="flex justify-between pt-2 mt-1 border-t border-gray-200 font-semibold"
                style={{ color: C.ink }}
              >
                <dt>Net received</dt>
                <dd className="tabular-nums">{fmt(netReceived, currency)}</dd>
              </div>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
