import { z } from "zod";

const playSchema = z.object({
  title: z.string().trim().min(1).max(120),
  rationale: z.string().trim().min(1).max(300),
});

export const relationshipReadResultSchema = z.object({
  headline: z.string().trim().min(1).max(120),
  assessment: z.string().trim().min(1).max(1000),
  plays: z.array(playSchema).max(3),
});

export type RelationshipReadResult = z.infer<typeof relationshipReadResultSchema>;

export function parseRelationshipReadResult(
  input: unknown,
): { ok: true; data: RelationshipReadResult } | { ok: false; error: string } {
  const result = relationshipReadResultSchema.safeParse(input);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid relationship read result.";
    return { ok: false, error: message };
  }
  return { ok: true, data: result.data };
}
