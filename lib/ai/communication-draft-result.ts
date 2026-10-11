import { z } from "zod";

export const communicationDraftModeSchema = z.enum(["follow_up", "reply"]);
export const communicationToneSchema = z.enum(["friendly", "firm", "formal"]);

/**
 * The record a drafted email is about. Filled server-side by the drafter from
 * the row it loaded (never by the model) so the composer can prefill the
 * recipient and attach the document when sending.
 */
export const communicationDraftLinkSchema = z.object({
  kind: z.enum(["document", "client", "project"]),
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(120),
  clientId: z.string().uuid().nullable(),
  recipientEmail: z.string().trim().email().nullable(),
});

export const communicationDraftResultSchema = z.object({
  mode: communicationDraftModeSchema,
  tone: communicationToneSchema,
  subject: z.string().trim().max(200).nullable(),
  body: z.string().trim().min(1).max(4000),
  targetSummary: z.string().trim().max(300),
  link: communicationDraftLinkSchema.nullable().optional(),
});

export type CommunicationDraftMode = z.infer<typeof communicationDraftModeSchema>;
export type CommunicationTone = z.infer<typeof communicationToneSchema>;
export type CommunicationDraftLink = z.infer<typeof communicationDraftLinkSchema>;
export type CommunicationDraftResult = z.infer<typeof communicationDraftResultSchema>;

/**
 * Builds the draft link from loaded row data. A malformed stored email
 * becomes `null` (user types it) instead of failing the whole draft.
 */
export function buildDraftLink(input: {
  kind: CommunicationDraftLink["kind"];
  id: string;
  label: string;
  clientId: string | null;
  recipientEmail: string | null | undefined;
}): CommunicationDraftLink | null {
  const email = input.recipientEmail?.trim() ?? "";
  const candidate = {
    kind: input.kind,
    id: input.id,
    label: input.label.trim().slice(0, 120),
    clientId: input.clientId,
    recipientEmail: email && z.string().email().safeParse(email).success ? email : null,
  };
  const parsed = communicationDraftLinkSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function parseCommunicationDraftResult(
  input: unknown,
): { ok: true; data: CommunicationDraftResult } | { ok: false; error: string } {
  const result = communicationDraftResultSchema.safeParse(input);
  if (!result.success) {
    const message =
      result.error.issues[0]?.message ?? "Invalid communication draft response.";
    return { ok: false, error: message };
  }
  return { ok: true, data: result.data };
}
