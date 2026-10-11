import { z } from "zod";

export const documentDraftLineItemSchema = z.object({
  description: z.string().trim().min(1).max(300),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  /** Per-line tax %, carried over from a source document. */
  taxRate: z.number().min(0).max(100).optional(),
});

export const documentDraftResultSchema = z.object({
  title: z.string().trim().min(1).max(200),
  docType: z.enum(["proposal", "quote", "invoice"]),
  lineItems: z.array(documentDraftLineItemSchema).min(1),
  terms: z.string().trim().max(2000),
  notes: z.string().trim().max(2000),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO 4217 code."),
  clientMatchStatus: z.enum(["matched", "ambiguous", "none"]),
  matchedClientId: z.string().optional(),
  matchedClientCandidates: z.array(z.string()).optional(),
  /** Project the document belongs to (server-verified). */
  projectId: z.string().uuid().optional(),
  /** Quote/proposal the draft was built from (server-verified); its items are copied exactly. */
  sourceDocumentId: z.string().uuid().optional(),
});

export type DocumentDraftLineItem = z.infer<typeof documentDraftLineItemSchema>;
export type DocumentDraftResult = z.infer<typeof documentDraftResultSchema>;

export function parseDocumentDraftResult(
  input: unknown,
): { ok: true; data: DocumentDraftResult } | { ok: false; error: string } {
  const result = documentDraftResultSchema.safeParse(input);
  if (!result.success) {
    const message =
      result.error.issues[0]?.message ?? "Invalid document draft response.";
    return { ok: false, error: message };
  }
  return { ok: true, data: result.data };
}
