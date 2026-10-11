import type { LineItemRow } from "@/types";
import { computeDocumentTax, roundMoney, type TaxMode } from "@/lib/documents/tax/compute-tax";

type DiscountType = "percent" | "flat";

type ComputeLpoSheetTotalsInput = {
  lineItems: LineItemRow[];
  discountValue?: number | null;
  discountType?: DiscountType | null;
  lpoAmount?: number | null;
  /** Document-level tax. When not "none" it replaces the per-line rate. */
  taxMode?: TaxMode | null;
  taxRate?: number | string | null;
};

export type LpoSheetTotals = {
  subtotal: number;
  discount: number;
  discountLabel: string | null;
  taxableSubtotal: number;
  tax: number;
  taxLabel: string | null;
  totalBeforeCap: number;
  capAdjustment: number;
  authorisedTotal: number;
};


export function computeLpoSheetTotals({
  lineItems,
  discountValue = 0,
  discountType = "percent",
  lpoAmount = null,
  taxMode = "none",
  taxRate = 0,
}: ComputeLpoSheetTotalsInput): LpoSheetTotals {
  const subtotal = roundMoney(
    lineItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
      0,
    ),
  );
  const safeDiscountValue = Number(discountValue ?? 0);
  const discount =
    discountType === "flat"
      ? Math.min(safeDiscountValue, subtotal)
      : subtotal * (safeDiscountValue / 100);
  const roundedDiscount = roundMoney(discount);
  const taxableSubtotal = roundMoney(subtotal - roundedDiscount);
  const useDocumentTax = taxMode != null && taxMode !== "none";
  const effectiveRate = useDocumentTax
    ? Number(taxRate ?? 0)
    : Math.max(0, ...lineItems.map((item) => Number(item.tax_rate ?? 0)));
  const { lines: taxLines, totalTax } = computeDocumentTax({
    taxableSubtotal,
    taxMode: useDocumentTax ? taxMode : effectiveRate > 0 ? "vat" : "none",
    taxRate: effectiveRate,
  });
  const tax = totalTax;
  const taxLabel = taxLines[0]?.label ?? null;
  const totalBeforeCap = roundMoney(taxableSubtotal + tax);
  const authorisedTotal = roundMoney(
    lpoAmount != null ? Number(lpoAmount) : totalBeforeCap,
  );
  const capAdjustment = roundMoney(authorisedTotal - totalBeforeCap);

  return {
    subtotal,
    discount: roundedDiscount,
    discountLabel:
      safeDiscountValue > 0
        ? discountType === "flat"
          ? "Discount"
          : `Discount (${safeDiscountValue}%)`
        : null,
    taxableSubtotal,
    tax,
    taxLabel,
    totalBeforeCap,
    capAdjustment,
    authorisedTotal,
  };
}
