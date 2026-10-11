"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

function revalidateAppLayout() {
  revalidatePath("/dashboard", "layout");
  revalidateTag("notifications");
}

export async function markNotificationRead(
  notificationId: string
): Promise<{ ok: boolean; error?: string }> {
  const parsed = uuidSchema.safeParse(notificationId);
  if (!parsed.success) {
    return { ok: false, error: "Invalid notification" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };

  revalidateAppLayout();
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };

  revalidateAppLayout();
  return { ok: true };
}

export async function deleteNotification(
  notificationId: string
): Promise<{ ok: boolean; error?: string }> {
  const parsed = uuidSchema.safeParse(notificationId);
  if (!parsed.success) return { ok: false, error: "Invalid notification" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidateAppLayout();
  return { ok: true };
}

export async function clearAllNotifications(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidateAppLayout();
  return { ok: true };
}
