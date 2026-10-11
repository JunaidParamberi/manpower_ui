import { z } from "zod";

import { AGENT_IDS } from "@/lib/ai/agents";

export const routerPayloadSchema = z.object({
  intent: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(500),
  entities: z.record(z.string(), z.string()).optional(),
});

export const routerResultSchema = z.object({
  agent: z.enum(AGENT_IDS),
  confidence: z.number().min(0).max(1),
  payload: routerPayloadSchema,
});

export type RouterPayload = z.infer<typeof routerPayloadSchema>;
export type RouterResult = z.infer<typeof routerResultSchema>;

export function parseRouterResult(
  input: unknown,
):
  | { ok: true; data: RouterResult }
  | { ok: false; error: string } {
  const result = routerResultSchema.safeParse(input);
  if (!result.success) {
    const message =
      result.error.issues[0]?.message ?? "Invalid router response.";
    return { ok: false, error: message };
  }
  return { ok: true, data: result.data };
}

/**
 * Extract JSON from Haiku output that may include markdown fences.
 */
export function extractJsonFromModelText(text: string): unknown {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  return JSON.parse(candidate) as unknown;
}
