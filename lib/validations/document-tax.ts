import { z } from "zod";
import { taxModeSchema } from "@/lib/documents/tax/compute-tax";

export const documentTaxSchema = z
  .object({
    tax_mode: taxModeSchema.default("none"),
    tax_rate: z.coerce.number().min(0).max(100).default(0),
  })
  .transform((v) => (v.tax_mode === "none" ? { ...v, tax_rate: 0 } : v));

export type DocumentTaxInput = z.infer<typeof documentTaxSchema>;
