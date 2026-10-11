import { z } from "zod";

import type { TaskPriority, TaskStatus } from "@/types";

/** Align with DB `title` text and app limits. */
export const TASK_LIMITS = {
  title: 500,
  description: 5000,
  commentBody: 5000,
  label: 24,
  labelsMax: 6,
  estimatedMinutesMax: 100_000,
} as const;

const taskLabelsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Label cannot be empty.")
      .max(TASK_LIMITS.label, `Label must be at most ${TASK_LIMITS.label} characters.`),
  )
  .max(TASK_LIMITS.labelsMax, `At most ${TASK_LIMITS.labelsMax} labels.`);

const TASK_STATUSES = [
  "todo",
  "in_progress",
  "done",
  "cancelled",
] as const satisfies readonly TaskStatus[];

const TASK_PRIORITIES = ["low", "medium", "high"] as const satisfies readonly TaskPriority[];

const taskStatusSchema = z.enum(TASK_STATUSES);
const taskPrioritySchema = z.enum(TASK_PRIORITIES);

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const uuidSchema = z.string().uuid();

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

function parseOptionalTimestamp(
  raw: string | null | undefined,
): string | null | "__invalid__" {
  const t = raw?.trim() ?? "";
  if (t === "") {
    return null;
  }
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) {
    return "__invalid__";
  }
  return d.toISOString();
}

function parseOptionalEstimate(
  raw: string | number | null | undefined,
): number | null | "__invalid__" {
  if (raw === undefined || raw === null) {
    return null;
  }
  if (typeof raw === "string" && raw.trim() === "") {
    return null;
  }
  const n = typeof raw === "number" ? raw : Number(raw.trim());
  if (
    !Number.isInteger(n) ||
    n < 0 ||
    n > TASK_LIMITS.estimatedMinutesMax
  ) {
    return "__invalid__";
  }
  return n;
}

function parseOptionalParentTaskId(
  raw: string | null | undefined,
): string | null | "__invalid__" {
  if (raw === undefined || raw === null) {
    return null;
  }
  const t = raw.trim();
  if (t === "") {
    return null;
  }
  return uuidSchema.safeParse(t).success ? t : "__invalid__";
}

export const taskCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(TASK_LIMITS.title),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  due_date: z.string(),
  labels: taskLabelsSchema.optional(),
  description: z.string().max(TASK_LIMITS.description).nullable().optional(),
  start_date: z.string().optional(),
  completed_at: z.string().nullable().optional(),
  estimated_minutes: z.union([z.string(), z.number(), z.null()]).optional(),
  sort_order: z.number().int().nonnegative().optional(),
  client_visible: z.boolean().optional(),
  parent_task_id: z.union([z.string(), z.null()]).optional(),
  milestone_id: z.union([z.string(), z.null()]).optional(),
});

/** Form schema for task edit sheet — labels always present in UI state. */
export const taskEditFormSchema = taskCreateSchema.extend({
  labels: taskLabelsSchema,
});

export type TaskEditFormValues = z.infer<typeof taskEditFormSchema>;

export type TaskCreateFormInput = z.input<typeof taskCreateSchema>;

export type TaskCreatePayload = {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  labels: string[];
  description: string | null;
  start_date: string | null;
  completed_at: string | null;
  estimated_minutes: number | null;
  sort_order: number;
  client_visible: boolean;
  parent_task_id: string | null;
  milestone_id: string | null;
};

export function parseTaskCreateInput(
  raw: unknown,
):
  | { success: true; data: TaskCreatePayload }
  | { success: false; error: z.ZodError } {
  const parsed = taskCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const d = parsed.data;
  const due = parseOptionalDate(d.due_date);
  if (due === "__invalid__") {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", message: "Use YYYY-MM-DD for due date.", path: ["due_date"] },
      ]),
    };
  }
  const start = parseOptionalDate(d.start_date ?? "");
  if (start === "__invalid__") {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", message: "Use YYYY-MM-DD for start date.", path: ["start_date"] },
      ]),
    };
  }
  const completed = parseOptionalTimestamp(d.completed_at);
  if (completed === "__invalid__") {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", message: "Use an ISO timestamp for completion.", path: ["completed_at"] },
      ]),
    };
  }
  const estimate = parseOptionalEstimate(d.estimated_minutes);
  if (estimate === "__invalid__") {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", message: "Estimate must be a non-negative whole number of minutes.", path: ["estimated_minutes"] },
      ]),
    };
  }
  const parentTaskId = parseOptionalParentTaskId(d.parent_task_id);
  if (parentTaskId === "__invalid__") {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", message: "Invalid parent task.", path: ["parent_task_id"] },
      ]),
    };
  }
  const milestoneId = parseOptionalParentTaskId(d.milestone_id);
  if (milestoneId === "__invalid__") {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", message: "Invalid milestone.", path: ["milestone_id"] },
      ]),
    };
  }

  return {
    success: true,
    data: {
      title: d.title.trim(),
      status: d.status,
      priority: d.priority,
      due_date: due,
      labels: (d.labels ?? []).map((l) => l.trim()),
      description: parseOptionalText(d.description),
      start_date: start,
      completed_at: completed,
      estimated_minutes: estimate,
      sort_order: d.sort_order ?? 0,
      client_visible: d.client_visible ?? false,
      parent_task_id: parentTaskId,
      milestone_id: milestoneId,
    },
  };
}

export const taskUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty.")
    .max(TASK_LIMITS.title)
    .optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  due_date: z.string().optional(),
  labels: taskLabelsSchema.optional(),
  description: z.string().max(TASK_LIMITS.description).nullable().optional(),
  start_date: z.string().optional(),
  completed_at: z.string().nullable().optional(),
  estimated_minutes: z.union([z.string(), z.number(), z.null()]).optional(),
  sort_order: z.number().int().nonnegative().optional(),
  client_visible: z.boolean().optional(),
  parent_task_id: z.union([z.string(), z.null()]).optional(),
  milestone_id: z.union([z.string(), z.null()]).optional(),
});

export type TaskUpdateFormInput = z.input<typeof taskUpdateSchema>;

export type TaskUpdatePayload = Partial<{
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  labels: string[];
  description: string | null;
  start_date: string | null;
  completed_at: string | null;
  estimated_minutes: number | null;
  sort_order: number;
  client_visible: boolean;
  parent_task_id: string | null;
  milestone_id: string | null;
}>;

export function parseTaskUpdateInput(
  raw: unknown,
):
  | { success: true; data: TaskUpdatePayload }
  | { success: false; error: z.ZodError } {
  const parsed = taskUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const d = parsed.data;
  const keys = Object.keys(d).filter(
    (k) => d[k as keyof typeof d] !== undefined,
  );
  if (keys.length === 0) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          message: "Provide at least one field to update.",
          path: [],
        },
      ]),
    };
  }

  const out: TaskUpdatePayload = {};

  if (d.title !== undefined) {
    out.title = d.title.trim();
  }
  if (d.status !== undefined) {
    out.status = d.status;
  }
  if (d.priority !== undefined) {
    out.priority = d.priority;
  }

  if (d.due_date !== undefined) {
    const due = parseOptionalDate(d.due_date);
    if (due === "__invalid__") {
      return {
        success: false,
        error: new z.ZodError([
          { code: "custom", message: "Use YYYY-MM-DD for due date.", path: ["due_date"] },
        ]),
      };
    }
    out.due_date = due;
  }

  if (d.labels !== undefined) {
    out.labels = d.labels.map((l) => l.trim());
  }
  if (d.description !== undefined) {
    out.description = parseOptionalText(d.description);
  }
  if (d.start_date !== undefined) {
    const start = parseOptionalDate(d.start_date);
    if (start === "__invalid__") {
      return {
        success: false,
        error: new z.ZodError([
          { code: "custom", message: "Use YYYY-MM-DD for start date.", path: ["start_date"] },
        ]),
      };
    }
    out.start_date = start;
  }
  if (d.completed_at !== undefined) {
    const completed = parseOptionalTimestamp(d.completed_at);
    if (completed === "__invalid__") {
      return {
        success: false,
        error: new z.ZodError([
          { code: "custom", message: "Use an ISO timestamp for completion.", path: ["completed_at"] },
        ]),
      };
    }
    out.completed_at = completed;
  }
  if (d.estimated_minutes !== undefined) {
    const estimate = parseOptionalEstimate(d.estimated_minutes);
    if (estimate === "__invalid__") {
      return {
        success: false,
        error: new z.ZodError([
          { code: "custom", message: "Estimate must be a non-negative whole number of minutes.", path: ["estimated_minutes"] },
        ]),
      };
    }
    out.estimated_minutes = estimate;
  }
  if (d.sort_order !== undefined) {
    out.sort_order = d.sort_order;
  }
  if (d.client_visible !== undefined) {
    out.client_visible = d.client_visible;
  }
  if (d.parent_task_id !== undefined) {
    const parentTaskId = parseOptionalParentTaskId(d.parent_task_id);
    if (parentTaskId === "__invalid__") {
      return {
        success: false,
        error: new z.ZodError([
          { code: "custom", message: "Invalid parent task.", path: ["parent_task_id"] },
        ]),
      };
    }
    out.parent_task_id = parentTaskId;
  }
  if (d.milestone_id !== undefined) {
    const milestoneId = parseOptionalParentTaskId(d.milestone_id);
    if (milestoneId === "__invalid__") {
      return {
        success: false,
        error: new z.ZodError([
          { code: "custom", message: "Invalid milestone.", path: ["milestone_id"] },
        ]),
      };
    }
    out.milestone_id = milestoneId;
  }

  return { success: true, data: out };
}

export const taskCommentCreateSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty.")
    .max(TASK_LIMITS.commentBody),
  client_visible: z.boolean().optional(),
});

export type TaskCommentCreatePayload = {
  body: string;
  client_visible: boolean;
};

export function parseTaskCommentCreateInput(
  raw: unknown,
):
  | { success: true; data: TaskCommentCreatePayload }
  | { success: false; error: z.ZodError } {
  const parsed = taskCommentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  return {
    success: true,
    data: {
      body: parsed.data.body.trim(),
      client_visible: parsed.data.client_visible ?? false,
    },
  };
}
