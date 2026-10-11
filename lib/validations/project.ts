import { z } from "zod";

import type { ProjectStatus } from "@/types";

/** Align with DB constraints (migration `*_projects_tasks.sql`). */
export const PROJECT_LIMITS = {
  title: 300,
} as const;

const PROJECT_STATUSES = [
  "planning",
  "active",
  "on_hold",
  "completed",
  "archived",
] as const satisfies readonly ProjectStatus[];

const projectStatusSchema = z.enum(PROJECT_STATUSES);

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

function parseOptionalDateString(raw: string): string | null {
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

function parseOptionalMoney(
  raw: unknown,
): { ok: true; value: number | null } | { ok: false; message: string } {
  if (raw === undefined || raw === null) {
    return { ok: true, value: null };
  }
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) {
      return { ok: false, message: "Budget and spent must be non-negative numbers." };
    }
    return { ok: true, value: raw };
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (s === "") {
      return { ok: true, value: null };
    }
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, message: "Budget and spent must be non-negative numbers." };
    }
    return { ok: true, value: n };
  }
  return { ok: false, message: "Budget and spent must be numbers or empty." };
}

export const projectCreateSchema = z.object({
  client_id: z.string().trim().uuid("Invalid client."),
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(PROJECT_LIMITS.title),
  status: projectStatusSchema,
  budget: z.union([z.string(), z.number()]).optional(),
  spent: z.union([z.string(), z.number()]).optional(),
  hourly_rate: z.union([z.string(), z.number()]).optional(),
  start_date: z.string(),
  deadline: z.string(),
});

export type ProjectCreateFormInput = z.input<typeof projectCreateSchema>;

export type ProjectCreatePayload = {
  client_id: string;
  title: string;
  status: ProjectStatus;
  budget: number | null;
  spent: number | null;
  hourly_rate: number | null;
  start_date: string | null;
  deadline: string | null;
};

export function parseProjectCreateInput(
  raw: unknown,
):
  | { success: true; data: ProjectCreatePayload }
  | { success: false; error: z.ZodError } {
  const parsed = projectCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const d = parsed.data;
  const start = parseOptionalDateString(d.start_date);
  const end = parseOptionalDateString(d.deadline);
  if (start === "__invalid__") {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", message: "Use YYYY-MM-DD for start date.", path: ["start_date"] },
      ]),
    };
  }
  if (end === "__invalid__") {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", message: "Use YYYY-MM-DD for deadline.", path: ["deadline"] },
      ]),
    };
  }

  const budget = parseOptionalMoney(d.budget);
  if (!budget.ok) {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", message: budget.message, path: ["budget"] },
      ]),
    };
  }
  const spent = parseOptionalMoney(d.spent);
  if (!spent.ok) {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", message: spent.message, path: ["spent"] },
      ]),
    };
  }
  const hourlyRate = parseOptionalMoney(d.hourly_rate);
  if (!hourlyRate.ok) {
    return {
      success: false,
      error: new z.ZodError([
        { code: "custom", message: hourlyRate.message, path: ["hourly_rate"] },
      ]),
    };
  }

  return {
    success: true,
    data: {
      client_id: d.client_id,
      title: d.title.trim(),
      status: d.status,
      budget: budget.value,
      spent: spent.value,
      hourly_rate: hourlyRate.value,
      start_date: start,
      deadline: end,
    },
  };
}

export const projectUpdateSchema = z.object({
  client_id: z.string().trim().uuid("Invalid client.").optional(),
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty.")
    .max(PROJECT_LIMITS.title)
    .optional(),
  status: projectStatusSchema.optional(),
  budget: z.union([z.string(), z.number(), z.null()]).optional(),
  spent: z.union([z.string(), z.number(), z.null()]).optional(),
  hourly_rate: z.union([z.string(), z.number(), z.null()]).optional(),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
});

export type ProjectUpdateFormInput = z.input<typeof projectUpdateSchema>;

export type ProjectUpdatePayload = Partial<{
  client_id: string;
  title: string;
  status: ProjectStatus;
  budget: number | null;
  spent: number | null;
  hourly_rate: number | null;
  start_date: string | null;
  deadline: string | null;
}>;

export function parseProjectUpdateInput(
  raw: unknown,
):
  | { success: true; data: ProjectUpdatePayload }
  | { success: false; error: z.ZodError } {
  const parsed = projectUpdateSchema.safeParse(raw);
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

  const out: ProjectUpdatePayload = {};

  if (d.client_id !== undefined) {
    out.client_id = d.client_id;
  }
  if (d.title !== undefined) {
    out.title = d.title.trim();
  }
  if (d.status !== undefined) {
    out.status = d.status;
  }

  if (d.budget !== undefined) {
    const budget = parseOptionalMoney(d.budget);
    if (!budget.ok) {
      return {
        success: false,
        error: new z.ZodError([
          { code: "custom", message: budget.message, path: ["budget"] },
        ]),
      };
    }
    out.budget = budget.value;
  }

  if (d.spent !== undefined) {
    const spent = parseOptionalMoney(d.spent);
    if (!spent.ok) {
      return {
        success: false,
        error: new z.ZodError([
          { code: "custom", message: spent.message, path: ["spent"] },
        ]),
      };
    }
    out.spent = spent.value;
  }

  if (d.hourly_rate !== undefined) {
    const hourlyRate = parseOptionalMoney(d.hourly_rate);
    if (!hourlyRate.ok) {
      return {
        success: false,
        error: new z.ZodError([
          { code: "custom", message: hourlyRate.message, path: ["hourly_rate"] },
        ]),
      };
    }
    out.hourly_rate = hourlyRate.value;
  }

  if (d.start_date !== undefined) {
    const start = parseOptionalDateString(d.start_date);
    if (start === "__invalid__") {
      return {
        success: false,
        error: new z.ZodError([
          {
            code: "custom",
            message: "Use YYYY-MM-DD for start date.",
            path: ["start_date"],
          },
        ]),
      };
    }
    out.start_date = start;
  }

  if (d.deadline !== undefined) {
    const end = parseOptionalDateString(d.deadline);
    if (end === "__invalid__") {
      return {
        success: false,
        error: new z.ZodError([
          { code: "custom", message: "Use YYYY-MM-DD for deadline.", path: ["deadline"] },
        ]),
      };
    }
    out.deadline = end;
  }

  return { success: true, data: out };
}
