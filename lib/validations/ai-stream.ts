import { z } from "zod";

export const AI_STREAM_PROMPT_MAX = 4000;

export const aiStreamRequestSchema = z
  .object({
    prompt: z.string().trim().max(AI_STREAM_PROMPT_MAX).optional(),
    agent: z.string().trim().min(1).max(64).optional(),
    assistantMode: z.enum(["ask", "agent"]).optional(),
    threadId: z.string().uuid().optional(),
    pagePath: z.string().trim().max(200).optional(),
    mode: z.enum(["follow_up", "reply"]).optional(),
    tone: z.enum(["friendly", "firm", "formal"]).optional(),
    documentId: z.string().uuid().optional(),
    clientId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    incomingMessage: z.string().trim().max(AI_STREAM_PROMPT_MAX).optional(),
    input: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((val, ctx) => {
    const promptExempt =
      val.agent === "communication-drafter" ||
      val.agent === "content-marketer" ||
      val.agent === "relationship-manager";
    if (!promptExempt && (!val.prompt || val.prompt.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a prompt.",
        path: ["prompt"],
      });
    }
  });

export type AIStreamRequestInput = z.infer<typeof aiStreamRequestSchema>;

export function parseAIStreamRequest(
  input: unknown,
): { ok: true; data: AIStreamRequestInput } | { ok: false; error: string } {
  const result = aiStreamRequestSchema.safeParse(input);
  if (!result.success) {
    const message =
      result.error.issues[0]?.message ?? "Invalid AI stream request.";
    return { ok: false, error: message };
  }
  return { ok: true, data: result.data };
}
