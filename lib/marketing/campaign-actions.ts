"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { parseCampaignDrafts } from "@/lib/ai/content-draft-result";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { parseContentCampaign } from "@/lib/validations/content-campaign";

type MutationError = {
  ok: false;
  message: string;
};

export type SaveGeneratedCampaignResult =
  | { ok: true; campaignId: string; postCount: number }
  | MutationError;

async function clientBelongsToUser(
  supabase: Awaited<ReturnType<typeof getServerContext>>["supabase"],
  userId: string,
  clientId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("user_id", userId)
    .maybeSingle();
  return data !== null;
}

/**
 * Days between two YYYY-MM-DD dates, inclusive window length used for
 * clamping (e.g. start == end -> 0, one full week -> 6).
 */
function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

function scheduledAtForOffset(startDate: string, offset: number): string {
  const [year, month, day] = startDate.split("-").map(Number);
  return new Date(
    Date.UTC(year, month - 1, day + offset, 12, 0, 0),
  ).toISOString();
}

export async function saveGeneratedCampaign(
  input: unknown,
  drafts: unknown,
): Promise<SaveGeneratedCampaignResult> {
  const parsedInput = parseContentCampaign(input);
  if (!parsedInput.ok) {
    return { ok: false, message: parsedInput.error };
  }

  const parsedDrafts = parseCampaignDrafts(drafts);
  if (!parsedDrafts.ok) {
    return { ok: false, message: parsedDrafts.error };
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { clientId } = parsedInput.data;
  if (clientId !== null) {
    const owned = await clientBelongsToUser(supabase, user.id, clientId);
    if (!owned) {
      return { ok: false, message: "Client not found." };
    }
  }

  const { name, goal, startDate, endDate } = parsedInput.data;

  const { data: campaign, error: campaignError } = await supabase
    .from("content_campaigns")
    .insert({
      user_id: user.id,
      client_id: clientId,
      name,
      goal,
      start_date: startDate,
      end_date: endDate,
    })
    .select("id")
    .maybeSingle();

  if (campaignError) {
    return { ok: false, message: campaignError.message };
  }

  if (!campaign) {
    return { ok: false, message: "Campaign could not be created." };
  }

  const windowDays = Math.max(0, daysBetween(startDate, endDate));

  const postRows = parsedDrafts.value.map((draft) => {
    const clampedOffset = Math.min(Math.max(draft.dayOffset, 0), windowDays);
    return {
      user_id: user.id,
      client_id: clientId,
      campaign_id: campaign.id,
      title: draft.title,
      platform: draft.platform,
      caption: draft.caption,
      hashtags: draft.hashtags,
      status: "drafted" as const,
      scheduled_at: scheduledAtForOffset(startDate, clampedOffset),
    };
  });

  const { error: postsError } = await supabase
    .from("content_posts")
    .insert(postRows);

  if (postsError) {
    return { ok: false, message: postsError.message };
  }

  revalidateTag("content-posts");
  revalidateTag("content-campaigns");
  revalidatePath("/marketing");

  return { ok: true, campaignId: campaign.id, postCount: postRows.length };
}

export type DeleteCampaignResult = { ok: true } | MutationError;

const campaignIdSchema = z.string().uuid();

/**
 * Deletes a campaign. Its posts survive: content_posts.campaign_id is
 * `on delete set null`, so they simply lose their campaign tag. The confirm
 * copy in campaign-legend.tsx states this so it is not a surprise.
 */
export async function deleteCampaign(
  id: string,
): Promise<DeleteCampaignResult> {
  const parsedId = campaignIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid campaign." };
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { error, count } = await supabase
    .from("content_campaigns")
    .delete({ count: "exact" })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (count === 0) {
    return { ok: false, message: "Campaign not found." };
  }

  // Posts lose their campaign_id, so the post cache is stale too.
  revalidateTag("content-campaigns");
  revalidateTag("content-posts");
  revalidatePath("/marketing");
  return { ok: true };
}
