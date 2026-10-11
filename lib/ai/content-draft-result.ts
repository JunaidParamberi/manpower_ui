import { z } from "zod";

const singleSchema = z.object({
  caption: z.string().min(1).max(5000),
  hashtags: z.array(z.string().trim().min(1).max(60)).max(60).default([]),
});

export type SingleDraft = z.infer<typeof singleSchema>;

const campaignItemSchema = z.object({
  dayOffset: z.number().int().min(0).max(365),
  platform: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(140),
  caption: z.string().min(1).max(5000),
  hashtags: z.array(z.string().trim().min(1).max(60)).max(60).default([]),
});

export type CampaignDraftItem = z.infer<typeof campaignItemSchema>;

const campaignSchema = z.object({ posts: z.array(campaignItemSchema).min(1).max(60) });

export function parseSingleDraft(
  json: unknown,
): { ok: true; value: SingleDraft } | { ok: false; error: string } {
  const r = singleSchema.safeParse(json);
  if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? "Bad draft." };
  return { ok: true, value: r.data };
}

export function parseCampaignDrafts(
  json: unknown,
): { ok: true; value: CampaignDraftItem[] } | { ok: false; error: string } {
  const r = campaignSchema.safeParse(json);
  if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? "Bad campaign." };
  return { ok: true, value: r.data.posts };
}
