import { z } from "zod";

const uuidSchema = z.string().uuid();

const TIME_ENTRY_DESCRIPTION_MAX = 1000;

/** Trim; empty -> null for DB */
export const optionalTimeEntryDescriptionSchema = z
  .string()
  .max(
    TIME_ENTRY_DESCRIPTION_MAX,
    `Note must be at most ${TIME_ENTRY_DESCRIPTION_MAX} characters.`,
  )
  .optional()
  .transform((s): string | null => {
    if (s === undefined) {
      return null;
    }
    const t = s.trim();
    return t === "" ? null : t;
  });

/**
 * Parse a single instant; on success return UTC ISO 8601 for DB inserts.
 */
function parseInstantToIso(raw: string, path: "started_at" | "ended_at"):
  | { ok: true; iso: string }
  | { ok: false; error: z.ZodError } {
  const t = raw.trim();
  if (t === "") {
    return {
      ok: false,
      error: new z.ZodError([
        {
          code: "custom",
          message: "Date and time is required.",
          path: [path],
        },
      ]),
    };
  }
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) {
    return {
      ok: false,
      error: new z.ZodError([
        {
          code: "custom",
          message: "Use a valid date and time.",
          path: [path],
        },
      ]),
    };
  }
  return { ok: true, iso: d.toISOString() };
}

function normalizeOptionalTaskId(raw: unknown):
  | { ok: true; value: string | null }
  | { ok: false; error: z.ZodError } {
  if (raw === undefined || raw === null) {
    return { ok: true, value: null };
  }
  if (typeof raw !== "string") {
    return {
      ok: false,
      error: new z.ZodError([
        { code: "custom", message: "Invalid task.", path: ["task_id"] },
      ]),
    };
  }
  const t = raw.trim();
  if (t === "") {
    return { ok: true, value: null };
  }
  const parsed = uuidSchema.safeParse(t);
  if (!parsed.success) {
    return {
      ok: false,
      error: new z.ZodError([
        { code: "custom", message: "Invalid task.", path: ["task_id"] },
      ]),
    };
  }
  return { ok: true, value: t };
}

/** Duration from two instants; floor keeps completed rows as whole seconds per DB integer. */
export function durationSecondsBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

export const timeEntryManualCompleteSchema = z.object({
  project_id: uuidSchema,
  task_id: z.string().optional(),
  description: z.preprocess(
    (val) => (val === null ? undefined : val),
    optionalTimeEntryDescriptionSchema,
  ),
  started_at: z.string(),
  ended_at: z.string(),
});

export type TimeEntryManualCompleteFormInput = z.input<
  typeof timeEntryManualCompleteSchema
>;

export type TimeEntryManualCompletePayload = {
  project_id: string;
  task_id: string | null;
  description: string | null;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
};

export function parseTimeEntryManualCompleteInput(
  raw: unknown,
):
  | { success: true; data: TimeEntryManualCompletePayload }
  | { success: false; error: z.ZodError } {
  const parsed = timeEntryManualCompleteSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const taskNorm = normalizeOptionalTaskId(parsed.data.task_id);
  if (!taskNorm.ok) {
    return { success: false, error: taskNorm.error };
  }

  const start = parseInstantToIso(parsed.data.started_at, "started_at");
  if (!start.ok) {
    return { success: false, error: start.error };
  }
  const end = parseInstantToIso(parsed.data.ended_at, "ended_at");
  if (!end.ok) {
    return { success: false, error: end.error };
  }

  const startDate = new Date(start.iso);
  const endDate = new Date(end.iso);
  if (endDate.getTime() < startDate.getTime()) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          message: "End must be on or after start.",
          path: ["ended_at"],
        },
      ]),
    };
  }

  const duration_seconds = durationSecondsBetween(startDate, endDate);

  return {
    success: true,
    data: {
      project_id: parsed.data.project_id,
      task_id: taskNorm.value,
      description: parsed.data.description ?? null,
      started_at: start.iso,
      ended_at: end.iso,
      duration_seconds,
    },
  };
}

export const timeEntryStartSchema = z.object({
  project_id: uuidSchema,
  task_id: z.string().optional(),
  description: z.preprocess(
    (val) => (val === null ? undefined : val),
    optionalTimeEntryDescriptionSchema,
  ),
  started_at: z.string().min(1, "Start time is required."),
});

export type TimeEntryStartFormInput = z.input<typeof timeEntryStartSchema>;

export type TimeEntryStartPayload = {
  project_id: string;
  task_id: string | null;
  description: string | null;
  started_at: string;
};

export function parseTimeEntryStartInput(
  raw: unknown,
):
  | { success: true; data: TimeEntryStartPayload }
  | { success: false; error: z.ZodError } {
  const parsed = timeEntryStartSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const taskNorm = normalizeOptionalTaskId(parsed.data.task_id);
  if (!taskNorm.ok) {
    return { success: false, error: taskNorm.error };
  }

  const start = parseInstantToIso(parsed.data.started_at, "started_at");
  if (!start.ok) {
    return { success: false, error: start.error };
  }

  return {
    success: true,
    data: {
      project_id: parsed.data.project_id,
      task_id: taskNorm.value,
      description: parsed.data.description ?? null,
      started_at: start.iso,
    },
  };
}

export const updateRunningTimerDescriptionSchema = z.object({
  description: z.preprocess(
    (val) => (val === null ? undefined : val),
    optionalTimeEntryDescriptionSchema,
  ),
});

export type UpdateRunningTimerDescriptionPayload = {
  description: string | null;
};

export function parseUpdateRunningTimerDescriptionInput(
  raw: unknown,
):
  | { success: true; data: UpdateRunningTimerDescriptionPayload }
  | { success: false; error: z.ZodError } {
  const parsed = updateRunningTimerDescriptionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }
  return {
    success: true,
    data: { description: parsed.data.description ?? null },
  };
}
