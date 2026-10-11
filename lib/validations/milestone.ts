import { z } from "zod";

import type { ProjectMilestoneStatus } from "@/types";

export const MILESTONE_LIMITS = {
  title: 200,
  description: 2000,
} as const;

const MILESTONE_STATUSES = [
  "upcoming",
  "in_progress",
  "completed",
  "cancelled",
] as const satisfies readonly ProjectMilestoneStatus[];

const milestoneStatusSchema = z.enum(MILESTONE_STATUSES);
const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

function parseOptionalText(raw: string | null | undefined): string | null {
  const t = raw?.trim() ?? "";
  return t === "" ? null : t;
}

function parseOptionalDate(raw: string): string | null | "__invalid__" {
  const t = raw.trim();
  if (t === "") {
    return null;
  }
  if (!isoDateRegex.test(t)) {
    return "__invalid__";
  }
  const d = new Date(`${t}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return "__invalid__";
  }
  return t;
}

export const milestoneCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(MILESTONE_LIMITS.title),
  description: z
    .string()
    .max(MILESTONE_LIMITS.description)
    .nullable()
    .optional(),
  status: milestoneStatusSchema,
  due_date: z.string(),
  sort_order: z.number().int().nonnegative().optional(),
  client_visible: z.boolean().optional(),
});

export type MilestoneCreatePayload = {
  title: string;
  description: string | null;
  status: ProjectMilestoneStatus;
  due_date: string | null;
  sort_order: number;
  client_visible: boolean;
};

export function parseMilestoneCreateInput(
  raw: unknown,
):
  | { success: true; data: MilestoneCreatePayload }
  | { success: false; error: z.ZodError } {
  const parsed = milestoneCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const dueDate = parseOptionalDate(parsed.data.due_date);
  if (dueDate === "__invalid__") {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", message: "Use YYYY-MM-DD for due date.", path: ["due_date"] },
      ]),
    };
  }

  return {
    success: true,
    data: {
      title: parsed.data.title.trim(),
      description: parseOptionalText(parsed.data.description),
      status: parsed.data.status,
      due_date: dueDate,
      sort_order: parsed.data.sort_order ?? 0,
      client_visible: parsed.data.client_visible ?? false,
    },
  };
}

export const milestoneUpdateSchema = milestoneCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type MilestoneUpdatePayload = Partial<MilestoneCreatePayload>;

export function parseMilestoneUpdateInput(
  raw: unknown,
):
  | { success: true; data: MilestoneUpdatePayload }
  | { success: false; error: z.ZodError } {
  const parsed = milestoneUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const out: MilestoneUpdatePayload = {};
  if (parsed.data.title !== undefined) {
    out.title = parsed.data.title.trim();
  }
  if (parsed.data.description !== undefined) {
    out.description = parseOptionalText(parsed.data.description);
  }
  if (parsed.data.status !== undefined) {
    out.status = parsed.data.status;
  }
  if (parsed.data.due_date !== undefined) {
    const dueDate = parseOptionalDate(parsed.data.due_date);
    if (dueDate === "__invalid__") {
      return {
        success: false,
        error: new z.ZodError([
          { code: "custom", message: "Use YYYY-MM-DD for due date.", path: ["due_date"] },
        ]),
      };
    }
    out.due_date = dueDate;
  }
  if (parsed.data.sort_order !== undefined) {
    out.sort_order = parsed.data.sort_order;
  }
  if (parsed.data.client_visible !== undefined) {
    out.client_visible = parsed.data.client_visible;
  }

  return { success: true, data: out };
}
