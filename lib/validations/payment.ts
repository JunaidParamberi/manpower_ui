import { z } from "zod";

export const paymentMethodSchema = z.enum([
  "bank_transfer",
  "cash",
  "cheque",
  "card",
  "other",
]);

export const remainingActionSchema = z.enum(["keep_due", "write_off"]);

export const markPaidInputSchema = z
  .object({
    amount: z.coerce.number().positive(),
    method: paymentMethodSchema,
    reference: z.string().max(200).optional(),
    notes: z.string().max(500).optional(),
    fxRate: z.coerce.number().positive().optional(),
    remainingAction: remainingActionSchema.optional(),
    writeOffReason: z.string().trim().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.remainingAction === "write_off" && !value.writeOffReason) {
      ctx.addIssue({
        code: "custom",
        message: "Write-off reason is required.",
        path: ["writeOffReason"],
      });
    }
  });

export type MarkPaidInput = z.infer<typeof markPaidInputSchema>;
