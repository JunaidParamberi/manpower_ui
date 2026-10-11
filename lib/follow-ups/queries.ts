"use server";

import { unstable_cache } from "next/cache";

import { getServerContext } from "@/lib/supabase/get-server-context";
import { toneForRung, type FollowUpTone } from "@/lib/follow-ups/ladder";
import type { FollowUpTriggerType } from "@/types";

/** Most pending nudges shown at once. Beyond this the card stops being a list. */
const MAX_PENDING = 10;

export type PendingFollowUp = {
  id: string;
  triggerType: FollowUpTriggerType;
  subjectType: "document" | "project";
  subjectId: string;
  clientId: string | null;
  clientName: string | null;
  /** Prefills the composer's To field; null when the client has no email on file. */
  clientEmail: string | null;
  rung: number;
  tone: FollowUpTone;
  /** Display-only snapshot written at detection time. */
  facts: Record<string, string | number>;
  /** Date through unstable_cache arrives as an ISO string. */
  createdAt: Date | string;
};

const _cachedGetPendingFollowUps = unstable_cache(
  async (userId: string): Promise<PendingFollowUp[]> => {
    const { supabase } = await getServerContext();

    const { data } = await supabase
      .from("follow_ups")
      .select(
        "id, trigger_type, subject_type, subject_id, client_id, rung, facts, created_at, clients(name, email)",
      )
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(MAX_PENDING);

    return (data ?? []).map((row) => {
      type ClientRel = { name?: string | null; email?: string | null };
      const clientRel = row.clients as ClientRel | ClientRel[] | null;
      const client = Array.isArray(clientRel) ? clientRel[0] ?? null : clientRel;
      const clientName = client?.name ?? null;
      const clientEmail = client?.email ?? null;

      const triggerType = row.trigger_type as FollowUpTriggerType;
      const rung = Number(row.rung);

      return {
        id: row.id,
        triggerType,
        subjectType: row.subject_type as "document" | "project",
        subjectId: row.subject_id,
        clientId: row.client_id,
        clientName,
        clientEmail,
        rung,
        tone: toneForRung(triggerType, rung),
        facts: (row.facts ?? {}) as Record<string, string | number>,
        createdAt: row.created_at,
      };
    });
  },
  ["pending-follow-ups"],
  { revalidate: 60, tags: ["follow-ups"] },
);

export async function getPendingFollowUps(): Promise<PendingFollowUp[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  return _cachedGetPendingFollowUps(user.id);
}
