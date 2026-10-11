import { z } from "zod";

export const contentCampaignSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    goal: z.string().trim().min(1).max(1000),
    clientId: z.string().uuid().nullable().default(null),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    platforms: z.array(z.string().trim().min(1).max(60)).min(1).max(8),
    cadencePerWeek: z.number().int().min(1).max(7),
  })
  .superRefine((val, ctx) => {
    if (val.endDate < val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be on or after the start date.",
      });
    }
  });

export type ContentCampaignInput = z.infer<typeof contentCampaignSchema>;

export function parseContentCampaign(
  input: unknown,
): { ok: true; data: ContentCampaignInput } | { ok: false; error: string } {
  const parsed = contentCampaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid campaign." };
  }
  return { ok: true, data: parsed.data };
}
