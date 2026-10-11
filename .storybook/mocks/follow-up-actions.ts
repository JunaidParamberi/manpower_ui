/**
 * Storybook mock for `@/lib/follow-ups/actions`. The real module is a
 * "use server" file that talks to Supabase; stories must never reach it.
 */

export type FollowUpActionResult = { ok: boolean; error?: string };

export async function dismissFollowUp(
  id: string,
): Promise<FollowUpActionResult> {
  console.info("[storybook] dismissFollowUp", id);
  return { ok: true };
}

export async function markFollowUpSent(
  id: string,
): Promise<FollowUpActionResult> {
  console.info("[storybook] markFollowUpSent", id);
  return { ok: true };
}
