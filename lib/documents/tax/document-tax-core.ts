/**
 * Document-level tax maths with zero imports, so it runs unchanged in Node
 * (Next.js) and Deno (Supabase Edge Functions import it by relative path).
 * `compute-tax.ts` re-exports these alongside its Zod schema.
 */

export const TAX_MODES = ["none", "vat", "gst", "cgst_sgst", "igst"] as const;
export type TaxMode = (typeof TAX_MODES)[number];

export type TaxBreakdownLine = { label: string; rate: number; amount: number };
export type TaxResult = { lines: TaxBreakdownLine[]; totalTax: number };

type ComputeDocumentTaxInput = {
  taxableSubtotal: number;
  taxMode: TaxMode;
  taxRate: number;
};

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function isTaxMode(value: unknown): value is TaxMode {
  return typeof value === "string" && (TAX_MODES as readonly string[]).includes(value);
}

export function computeDocumentTax({
  taxableSubtotal,
  taxMode,
  taxRate,
}: ComputeDocumentTaxInput): TaxResult {
  if (taxMode === "none" || taxRate <= 0 || taxableSubtotal <= 0) {
    return { lines: [], totalTax: 0 };
  }

  if (taxMode === "cgst_sgst") {
    const halfRate = taxRate / 2;
    const halfAmount = roundMoney((taxableSubtotal * halfRate) / 100);
    const lines: TaxBreakdownLine[] = [
      { label: `CGST ${halfRate}%`, rate: halfRate, amount: halfAmount },
      { label: `SGST ${halfRate}%`, rate: halfRate, amount: halfAmount },
    ];
    return { lines, totalTax: roundMoney(halfAmount * 2) };
  }

  const labelPrefix = taxMode.toUpperCase(); // VAT | GST | IGST
  const amount = roundMoney((taxableSubtotal * taxRate) / 100);
  return {
    lines: [{ label: `${labelPrefix} ${taxRate}%`, rate: taxRate, amount }],
    totalTax: amount,
  };
}
