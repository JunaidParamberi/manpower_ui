import { z } from "zod";

export const POST_STATUSES = ["idea", "drafted", "scheduled", "posted"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

const mediaItemSchema = z.object({
  path: z.string().min(1),
  mime: z.string().min(1),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
});

export const contentPostSchema = z
  .object({
    title: z.string().trim().min(1).max(140),
    clientId: z.string().uuid().nullable().default(null),
    campaignId: z.string().uuid().nullable().default(null),
    platform: z.string().trim().min(1).max(60),
    caption: z.string().max(5000).default(""),
    hashtags: z.array(z.string().trim().min(1).max(60)).max(60).default([]),
    media: z.array(mediaItemSchema).max(10).default([]),
    status: z.enum(POST_STATUSES),
    scheduledAt: z.string().datetime().nullable().default(null),
  })
  .superRefine((val, ctx) => {
    if ((val.status === "scheduled" || val.status === "posted") && !val.scheduledAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledAt"],
        message: "A scheduled or posted post needs a date.",
      });
    }
  });

export type ContentPostInput = z.infer<typeof contentPostSchema>;

export function parseContentPost(
  input: unknown,
): { ok: true; data: ContentPostInput } | { ok: false; error: string } {
  const parsed = contentPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid post." };
  }
  return { ok: true, data: parsed.data };
}
