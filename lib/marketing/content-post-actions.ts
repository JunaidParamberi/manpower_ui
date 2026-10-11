"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { buildMediaPath } from "@/lib/marketing/media-utils";
import type {
  ContentPostRow,
  MediaItem,
} from "@/lib/marketing/content-post-queries";
import { getServerContext } from "@/lib/supabase/get-server-context";
import { parseContentPost } from "@/lib/validations/content-post";

const uuidSchema = z.string().uuid();
const MEDIA_BUCKET = "content-media";
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

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

async function campaignBelongsToUser(
  supabase: Awaited<ReturnType<typeof getServerContext>>["supabase"],
  userId: string,
  campaignId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("content_campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("user_id", userId)
    .maybeSingle();
  return data !== null;
}

type MutationError = {
  ok: false;
  message: string;
};

export type CreateContentPostResult =
  | { ok: true; post: ContentPostRow }
  | MutationError;

export type UpdateContentPostResult =
  | { ok: true; post: ContentPostRow }
  | MutationError;

export type DeleteContentPostResult = { ok: true } | MutationError;

function revalidateContentPosts() {
  revalidateTag("content-posts");
  // Campaign rows are cached with a content_posts(count) rollup, so creating,
  // re-assigning, or deleting a post changes campaign data too.
  revalidateTag("content-campaigns");
  revalidatePath("/marketing");
}

type ContentPostRowRaw = {
  id: string;
  title: string;
  platform: string;
  caption: string;
  hashtags: string[] | null;
  media: unknown;
  status: string;
  scheduled_at: string | null;
  client_id: string | null;
  campaign_id: string | null;
};

function normalizeContentPostRow(row: ContentPostRowRaw): ContentPostRow {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    caption: row.caption,
    hashtags: Array.isArray(row.hashtags) ? row.hashtags : [],
    media: Array.isArray(row.media) ? (row.media as MediaItem[]) : [],
    status: row.status as ContentPostRow["status"],
    scheduledAt: row.scheduled_at,
    clientId: row.client_id,
    clientName: null,
    campaignId: row.campaign_id,
  };
}

export async function createContentPost(
  input: unknown,
): Promise<CreateContentPostResult> {
  const parsed = parseContentPost(input);
  if (!parsed.ok) {
    return { ok: false, message: parsed.error };
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  if (parsed.data.clientId !== null) {
    const owned = await clientBelongsToUser(
      supabase,
      user.id,
      parsed.data.clientId,
    );
    if (!owned) {
      return { ok: false, message: "Client not found." };
    }
  }

  if (parsed.data.campaignId !== null) {
    const owned = await campaignBelongsToUser(
      supabase,
      user.id,
      parsed.data.campaignId,
    );
    if (!owned) {
      return { ok: false, message: "Campaign not found." };
    }
  }

  const { data, error } = await supabase
    .from("content_posts")
    .insert({
      user_id: user.id,
      client_id: parsed.data.clientId,
      campaign_id: parsed.data.campaignId,
      title: parsed.data.title,
      platform: parsed.data.platform,
      caption: parsed.data.caption,
      hashtags: parsed.data.hashtags,
      media: parsed.data.media,
      status: parsed.data.status,
      scheduled_at: parsed.data.scheduledAt,
    })
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Post could not be created." };
  }

  revalidateContentPosts();
  return { ok: true, post: normalizeContentPostRow(data as ContentPostRowRaw) };
}

export async function updateContentPost(
  id: string,
  input: unknown,
): Promise<UpdateContentPostResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid post." };
  }

  const parsed = parseContentPost(input);
  if (!parsed.ok) {
    return { ok: false, message: parsed.error };
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  if (parsed.data.clientId !== null) {
    const owned = await clientBelongsToUser(
      supabase,
      user.id,
      parsed.data.clientId,
    );
    if (!owned) {
      return { ok: false, message: "Client not found." };
    }
  }

  if (parsed.data.campaignId !== null) {
    const owned = await campaignBelongsToUser(
      supabase,
      user.id,
      parsed.data.campaignId,
    );
    if (!owned) {
      return { ok: false, message: "Campaign not found." };
    }
  }

  const { data, error } = await supabase
    .from("content_posts")
    .update({
      client_id: parsed.data.clientId,
      campaign_id: parsed.data.campaignId,
      title: parsed.data.title,
      platform: parsed.data.platform,
      caption: parsed.data.caption,
      hashtags: parsed.data.hashtags,
      media: parsed.data.media,
      status: parsed.data.status,
      scheduled_at: parsed.data.scheduledAt,
    })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Post not found." };
  }

  revalidateContentPosts();
  return { ok: true, post: normalizeContentPostRow(data as ContentPostRowRaw) };
}

export async function deleteContentPost(
  id: string,
): Promise<DeleteContentPostResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid post." };
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { error, count } = await supabase
    .from("content_posts")
    .delete({ count: "exact" })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (count === 0) {
    return { ok: false, message: "Post not found." };
  }

  revalidateContentPosts();
  return { ok: true };
}

export type RescheduleContentPostResult =
  | { ok: true; post: ContentPostRow }
  | MutationError;

const rescheduleSchema = z.object({
  id: z.string().uuid(),
  scheduledAt: z.string().datetime().nullable(),
});

/**
 * Narrow mutation for drag-to-reschedule: touches only the date, so a drop
 * does not have to round-trip the whole post payload through
 * updateContentPost (and cannot accidentally clobber a caption mid-edit).
 *
 * Clearing the date (dropping a post back onto the unscheduled rail) demotes
 * a "scheduled" or "posted" post to "drafted", because contentPostSchema
 * treats a dateless scheduled/posted post as invalid.
 */
export async function rescheduleContentPost(
  id: string,
  scheduledAt: string | null,
): Promise<RescheduleContentPostResult> {
  const parsed = rescheduleSchema.safeParse({ id, scheduledAt });
  if (!parsed.success) {
    return { ok: false, message: "Invalid reschedule request." };
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: existing } = await supabase
    .from("content_posts")
    .select("status")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { ok: false, message: "Post not found." };
  }

  const currentStatus = (existing as { status: string }).status;
  const nextStatus =
    parsed.data.scheduledAt === null &&
    (currentStatus === "scheduled" || currentStatus === "posted")
      ? "drafted"
      : currentStatus;

  const { data, error } = await supabase
    .from("content_posts")
    .update({ scheduled_at: parsed.data.scheduledAt, status: nextStatus })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Post not found." };
  }

  revalidateContentPosts();
  return { ok: true, post: normalizeContentPostRow(data as ContentPostRowRaw) };
}

export type UploadPostMediaResult =
  | { ok: true; media: MediaItem }
  | MutationError;

export async function uploadPostMedia(
  formData: FormData,
): Promise<UploadPostMediaResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a file to upload." };
  }

  // Server-side validation: the `accept="image/*,video/*"` attribute on the
  // file input is client-side only and does not protect a direct server
  // action invocation.
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return { ok: false, message: "Only image or video files are allowed." };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "File must be 25MB or smaller." };
  }

  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const path = buildMediaPath(user.id, file.name);

  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    media: { path, mime: file.type, width: null, height: null },
  };
}

export type GetMediaSignedUrlResult =
  | { ok: true; url: string }
  | MutationError;

export async function getMediaSignedUrl(
  path: string,
): Promise<GetMediaSignedUrlResult> {
  const { supabase, user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(path, 3600);

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Could not sign media URL." };
  }

  return { ok: true, url: data.signedUrl };
}
