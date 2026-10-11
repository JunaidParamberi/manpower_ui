import { z } from "zod";

export const upgradePlanSchema = z.object({
  plan: z.enum(["starter", "pro", "agency"]),
});

export type UpgradePlanInput = z.infer<typeof upgradePlanSchema>;

export const lsWebhookSchema = z.object({
  meta: z.object({
    event_name: z.string(),
    custom_data: z
      .object({ user_id: z.string() })
      .optional()
      .nullable(),
  }),
  data: z.object({
    id: z.string(),
    attributes: z.object({
      status: z.string(),
      variant_id: z.number(),
      customer_id: z.number().optional().nullable(),
      renews_at: z.string().optional().nullable(),
      ends_at: z.string().optional().nullable(),
      urls: z
        .object({ customer_portal: z.string().optional().nullable() })
        .optional()
        .nullable(),
    }),
  }),
});

export type LsWebhookPayload = z.infer<typeof lsWebhookSchema>;
