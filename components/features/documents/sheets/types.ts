// Types for document sheet components.
// These are flattened view-model types derived from DB/VariableContext data.

import { computeDocumentTax, roundMoney, type TaxBreakdownLine, type TaxMode } from "@/lib/documents/tax/compute-tax";
import { computeDocumentTotals } from "@/lib/documents/compute-document-totals";

export type SheetBrand = {
  logoUrl: string | null;
  businessName: string | null;
  primaryColor: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  vatNumber: string | null; // TRN in UAE
};

export type SheetSender = {
  name: string | null;
  companyName: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  vatNumber: string | null;
};

export type SheetClient = {
  companyName: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  vatNumber: string | null;
};

export type SheetProject = {
  title: string | null;
  descriptionLines: string[];
};

export type SheetDocMeta = {
  number: string | null;
  issuedDate: string; // pre-formatted "14 May 2026"
  dueDate: string | null;
  validUntil: string | null;
  paymentTerms: string | null;
  currency: string;
  status: string | null;
};

export type SheetLineItem = {
  id: string;
  description: string;
  subDescription: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  isOptional?: boolean;
  hsnSac?: string | null;
};

export type SheetTotals = {
  subtotal: number;
  discount: number;
  discountLabel: string | null;
  tax: number;
  taxLabel: string | null;          // kept for back-compat (single-line consumers)
  taxLines: TaxBreakdownLine[];
  total: number;
  tds: number;           // TDS deduction amount (0 if disabled)
  tdsRate: number | null; // rate stored (null if tds=0)
  netReceived: number;   // total - tds
};

export type SheetPaymentInstruction = {
  label: string;
  value: string;
  isMono?: boolean;
};

export type SheetSignature = {
  label: string;
  name: string;
  role?: string;
  date: string | null;
  isSigned?: boolean;
};

// Helpers

export function formatSheetDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }); // "14 May 2026"
  } catch {
    return String(value);
  }
}

export function formatSheetAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount); // "9,200.00" — no currency symbol, used in table cells
}

export function formatSheetCurrency(amount: number, currency: string): string {
  return `${currency} ${formatSheetAmount(amount)}`; // "AED 9,200.00" — used in total lines
}

export function computeSheetTotals(
  items: SheetLineItem[],
  discountValue: number,
  discountType: "percent" | "flat",
  taxMode: TaxMode = "none",
  taxRate: number = 0,
  tdsEnabled: boolean = false,
  tdsRate: number = 0,
): SheetTotals {
  const billableItems = items.filter((i) => !i.isOptional);

  if (taxMode === "none") {
    const lineInputs = billableItems.map((i) => ({
      quantity: i.quantity,
      unit_price: i.unitPrice,
      tax_rate: i.taxRate,
    }));
    const base = computeDocumentTotals(lineInputs, discountValue, discountType);
    const tdsAmount =
      tdsEnabled && tdsRate > 0
        ? roundMoney(base.discountedSubtotal * tdsRate / 100)
        : 0;
    const netReceived = roundMoney(base.total - tdsAmount);

    const discountLabel =
      discountValue > 0
        ? discountType === "percent"
          ? `Discount (${discountValue}%)`
          : "Discount"
        : null;

    // Tax lives on the line items. Surface it as one row so totals always
    // show where the gap between subtotal and total comes from.
    const taxedRates = new Set(
      billableItems.filter((i) => i.taxRate > 0).map((i) => i.taxRate),
    );
    const uniformRate = taxedRates.size === 1 ? [...taxedRates][0] : null;
    const lineTaxLabel = uniformRate != null ? `Tax ${uniformRate}%` : "Tax";
    const lineTaxLines: TaxBreakdownLine[] =
      base.taxTotal > 0
        ? [{ label: lineTaxLabel, rate: uniformRate ?? 0, amount: base.taxTotal }]
        : [];

    return {
      subtotal: base.subtotal,
      discount: base.discount,
      discountLabel,
      tax: base.taxTotal,
      taxLabel: base.taxTotal > 0 ? lineTaxLabel : null,
      taxLines: lineTaxLines,
      total: base.total,
      tds: tdsAmount,
      tdsRate: tdsAmount > 0 ? tdsRate : null,
      netReceived,
    };
  }

  // Same canonical function balances, finance and the pay page use, so the
  // sheet total and the amount owed never differ by a rounding cent.
  const base = computeDocumentTotals(
    billableItems.map((i) => ({ quantity: i.quantity, unit_price: i.unitPrice, tax_rate: i.taxRate })),
    discountValue,
    discountType,
    { taxMode, taxRate },
  );
  const subtotal = base.subtotal;
  const discount = base.discount;
  const taxableSubtotal = base.discountedSubtotal;
  const { lines: taxLines } = computeDocumentTax({ taxableSubtotal, taxMode, taxRate });
  const totalTax = base.taxTotal;
  const total = base.total;

  const tdsAmount = tdsEnabled && tdsRate > 0 ? roundMoney(taxableSubtotal * tdsRate / 100) : 0;
  const netReceived = roundMoney(total - tdsAmount);

  const discountLabel =
    discountValue > 0
      ? discountType === "percent"
        ? `Discount (${discountValue}%)`
        : "Discount"
      : null;

  return {
    subtotal,
    discount,
    discountLabel,
    tax: totalTax,
    taxLabel: taxLines.length === 1 ? taxLines[0].label : null,
    taxLines,
    total,
    tds: tdsAmount,
    tdsRate: tdsAmount > 0 ? tdsRate : null,
    netReceived,
  };
}
