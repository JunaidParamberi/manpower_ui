import { z } from "zod";

export const HSN_SAC_REGEX = /^\d{4,8}$/;

/** Trim; empty → null; valid 4–8 digits → code; otherwise null (incomplete/invalid). */
export function normalizeHsnSacCode(raw: unknown): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  return HSN_SAC_REGEX.test(trimmed) ? trimmed : null;
}

export const lineItemInputSchema = z.object({
  id: z.string().uuid().optional(),
  description: z.string().max(500).default(""),
  notes: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() || null : v),
    z.string().max(1000).nullish(),
  ).optional(),
  quantity: z.coerce.number().positive().max(9999).default(1),
  unit_price: z.coerce.number().min(0).default(0),
  tax_rate: z.coerce.number().min(0).max(100).default(0),
  sort_order: z.coerce.number().int().min(0).default(0),
  hsn_sac_code: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() || null : v),
    z.string().regex(/^\d{4,8}$/, "HSN/SAC must be 4–8 digits").nullish(),
  ).optional(),
});

export type LineItemInput = z.infer<typeof lineItemInputSchema>;

export function parseLineItemInput(raw: unknown): LineItemInput {
  return lineItemInputSchema.parse(raw);
}

export function parseLineItemInputSafe(
  raw: unknown,
): { ok: true; data: LineItemInput } | { ok: false; error: string } {
  const result = lineItemInputSchema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues[0]?.message ?? "Invalid line item",
    };
  }
  return { ok: true, data: result.data };
}
