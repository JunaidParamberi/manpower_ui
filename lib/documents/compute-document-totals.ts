// Relative `.ts` import on purpose: Supabase Edge Functions (Deno) import
// this file by path, so it must not use the `@/` alias or npm packages.
import { computeDocumentTax, isTaxMode } from "./tax/document-tax-core.ts";

export type DocumentTotalsLineItem = {
  quantity: number | string;
  unit_price: number | string;
  tax_rate?: number | string | null;
};

export type DiscountType = "percent" | "flat";

/**
 * Tax set on the whole document (`documents.tax_mode` / `documents.tax_rate`).
 * When the mode is anything but "none", it replaces per-line tax — the same
 * rule the invoice sheet, PDF and pay page follow.
 */
export type DocumentTaxInput = {
  taxMode?: string | null;
  taxRate?: number | string | null;
};

export type DocumentTotals = {
  subtotal: number;
  discount: number;
  discountedSubtotal: number;
  taxTotal: number;
  total: number;
};

function toMoney(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100);
}

/**
 * Canonical document totals. Discount comes off before tax. Tax is either
 * document-level (`docTax` with a mode other than "none") on the discounted
 * subtotal, or per line with the discount prorated and each line rounded.
 * Used by payment balance, finance, dashboard, emails, editors, sheets and
 * the edge functions — pass `docTax` whenever the document row is at hand.
 */
export function computeDocumentTotals(
  lineItems: DocumentTotalsLineItem[],
  discountValue: number,
  discountType: DiscountType,
  docTax?: DocumentTaxInput | null,
): DocumentTotals {
  const subtotal = lineItems.reduce(
    (sum, li) => sum + toMoney(Number(li.quantity) * Number(li.unit_price)),
    0,
  );

  const discount =
    discountType === "flat"
      ? Math.min(discountValue, subtotal)
      : subtotal * (Math.min(discountValue, 100) / 100);

  const discountRatio = subtotal > 0 ? discount / subtotal : 0;

  const discountedSubtotal = toMoney(subtotal - discount);

  const taxMode = docTax?.taxMode;
  const taxTotal =
    isTaxMode(taxMode) && taxMode !== "none"
      ? computeDocumentTax({
          taxableSubtotal: discountedSubtotal,
          taxMode,
          taxRate: Number(docTax?.taxRate ?? 0),
        }).totalTax
      : lineItems.reduce((sum, li) => {
          const lineGross = toMoney(Number(li.quantity) * Number(li.unit_price));
          const lineNet = lineGross * (1 - discountRatio);
          return sum + toMoney(lineNet * (Number(li.tax_rate ?? 0) / 100));
        }, 0);

  const total = toMoney(discountedSubtotal + taxTotal);

  return {
    subtotal: toMoney(subtotal),
    discount: toMoney(discount),
    discountedSubtotal,
    taxTotal: toMoney(taxTotal),
    total,
  };
}
