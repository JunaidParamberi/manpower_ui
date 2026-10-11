import { z } from "zod";

export const composedEmailSchema = z.object({
  to: z.string().trim().email(),
  subject: z.string().trim().max(200),
  body: z.string().trim().min(1).max(4000),
  /** Record the email is about. A document link can attach its PDF. */
  documentId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  attachPdf: z.boolean().optional(),
});

export type ComposedEmailInput = z.infer<typeof composedEmailSchema>;

export function parseComposedEmail(
  input: unknown,
): { ok: true; data: ComposedEmailInput } | { ok: false; error: string } {
  const result = composedEmailSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Invalid email." };
  }
  if (result.data.attachPdf && !result.data.documentId) {
    return { ok: false, error: "Pick a document to attach." };
  }
  return { ok: true, data: result.data };
}
