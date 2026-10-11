import { z } from "zod";

/**
 * Body of an auto-send request from the generate-recurring-invoices cron.
 *
 * The caller is the Edge Function, not a browser, so `userId` is trusted only
 * because the request carries the shared cron secret. The route still scopes
 * every query to this id — a service-role client bypasses RLS.
 */
export const recurringAutoSendSchema = z.object({
  documentId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type RecurringAutoSendInput = z.infer<typeof recurringAutoSendSchema>;

export function parseRecurringAutoSend(
  input: unknown,
): { ok: true; data: RecurringAutoSendInput } | { ok: false; error: string } {
  const result = recurringAutoSendSchema.safeParse(input);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues[0]?.message ?? "Invalid auto-send request.",
    };
  }
  return { ok: true, data: result.data };
}
