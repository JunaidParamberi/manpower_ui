import { z } from "zod";

import { TAX_MODES, type TaxMode } from "./document-tax-core";

// Pure tax maths lives in document-tax-core.ts (shared with Deno edge functions).
export {
  TAX_MODES,
  computeDocumentTax,
  isTaxMode,
  roundMoney,
  type TaxBreakdownLine,
  type TaxMode,
  type TaxResult,
} from "./document-tax-core";

export const taxModeSchema = z.enum(TAX_MODES);

export const TAX_MODE_LABELS: Record<TaxMode, string> = {
  none: "None",
  vat: "VAT",
  gst: "GST",
  cgst_sgst: "CGST + SGST",
  igst: "IGST",
};
