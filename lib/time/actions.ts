"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";

import { pickEmbed } from "@/lib/supabase/pick-embed";

function pickEmbedTyped<T extends object>(
  raw: unknown,
  validate: (v: Record<string, unknown>) => boolean = () => true,
): T | null {
  const node = Array.isArray(raw) ? raw[0] : raw;
  if (!node || typeof node !== "object") return null;
  if (!validate(node as Record<string, unknown>)) return null;
  return node as T;
}
import { getServerContext } from "@/lib/supabase/get-server-context";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import {
  parseTimeEntryManualCompleteInput,
  parseTimeEntryStartInput,
  parseUpdateRunningTimerDescriptionInput,
} from "@/lib/validations/time-entry";
import { emptyTiptapDoc } from "@/lib/validations/document";
import { nextDocumentNumber } from "@/lib/documents/document-numbers";
import { computeDueDate } from "@/lib/documents/due-date";
import {
  buildLineItemsFromEntries,
  validateBillingSelection,
  type BillableEntry,
} from "./billing-utils";
import type { TimeEntryListRow, TimeEntryRow } from "@/types";

const uuidSchema = z.string().uuid();

async function projectBelongsToUser(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && !!data;
}

function revalidateTimePaths() {
  revalidatePath("/time");
  revalidateTag("dashboard");
  revalidateTag("time");
}

type TimeEntryRowRaw = {
  id: string;
  user_id: string;
  project_id: string;
  task_id: string | null;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  paused_at: string | null;
  total_paused_seconds: number | string;
  duration_seconds: number | string | null;
  billed: boolean;
  invoice_line_item_id: string | null;
  created_at: string;
  updated_at: string;
};

function normalizeTotalPausedSeconds(raw: number | string | null | undefined): number {
  if (raw === null || raw === undefined) {
    return 0;
  }
  return typeof raw === "number" ? raw : Number(raw);
}

/** Billable seconds when stopping: wall time minus completed pauses and current pause segment. */
function computeStoppedDurationSeconds(args: {
  started_at: string;
  ended_at: string;
  total_paused_seconds: number;
  paused_at: string | null;
}): number {
  const endMs = new Date(args.ended_at).getTime();
  const startMs = new Date(args.started_at).getTime();
  const wallSeconds = Math.floor((endMs - startMs) / 1000);
  let paused = args.total_paused_seconds;
  if (args.paused_at) {
    paused += Math.floor(
      (endMs - new Date(args.paused_at).getTime()) / 1000,
    );
  }
  return Math.max(0, wallSeconds - paused);
}

function normalizeTimeEntryRow(row: TimeEntryRowRaw): TimeEntryRow {
  const dur = row.duration_seconds;
  return {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    task_id: row.task_id,
    description: row.description ?? null,
    started_at: row.started_at,
    ended_at: row.ended_at,
    paused_at: row.paused_at ?? null,
    total_paused_seconds: normalizeTotalPausedSeconds(row.total_paused_seconds),
    duration_seconds:
      dur === null || dur === undefined
        ? null
        : typeof dur === "number"
          ? dur
          : Number(dur),
    billed: row.billed,
    invoice_line_item_id: row.invoice_line_item_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeTimeEntryListRow(
  raw: TimeEntryRowRaw & {
    projects?: unknown;
    tasks?: unknown;
  },
): TimeEntryListRow {
  const base = normalizeTimeEntryRow(raw);
  // Parse project embed preserving client_id and hourly_rate
  // (pickEmbed only returns { id, title } and strips extra fields).
  type ProjectListEmbed = {
    id: string;
    title: string;
    client_id: string | null;
    hourly_rate: number | null;
  };
  const projectRaw = pickEmbedTyped<ProjectListEmbed>(
    raw.projects,
    (v) => typeof v.id === "string" && typeof v.title === "string",
  );
  const project = projectRaw
    ? {
        id: projectRaw.id,
        title: projectRaw.title,
        client_id: projectRaw.client_id ?? null,
        hourly_rate: projectRaw.hourly_rate == null ? null : Number(projectRaw.hourly_rate),
      }
    : null;
  const taskEmbed = pickEmbed(raw.tasks, "title");
  return {
    ...base,
    project,
    task: taskEmbed ? { id: taskEmbed.id, title: taskEmbed.title } : null,
  };
}

async function hydrateTimeEntriesWithRelations(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  userId: string,
  entries: TimeEntryListRow[],
): Promise<TimeEntryListRow[]> {
  const missingProjectIds = [
    ...new Set(
      entries
        .filter((e) => !e.project && e.project_id)
        .map((e) => e.project_id),
    ),
  ];
  const missingTaskIds = [
    ...new Set(
      entries
        .filter((e) => !e.task && e.task_id)
        .map((e) => e.task_id as string),
    ),
  ];

  if (missingProjectIds.length === 0 && missingTaskIds.length === 0) {
    return entries;
  }

  type ProjectHydrationRow = {
    id: string;
    title: string;
    client_id: string | null;
    hourly_rate: number | null;
  };

  const [projectsRes, tasksRes] = await Promise.all([
    missingProjectIds.length > 0
      ? supabase
          .from("projects")
          .select("id, title, client_id, hourly_rate")
          .eq("user_id", userId)
          .in("id", missingProjectIds)
      : Promise.resolve({ data: [] as ProjectHydrationRow[], error: null }),
    missingTaskIds.length > 0
      ? supabase.from("tasks").select("id, title").in("id", missingTaskIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const projectsById = new Map(
    ((projectsRes.data ?? []) as ProjectHydrationRow[]).map((p) => [p.id, p]),
  );
  const tasksById = new Map((tasksRes.data ?? []).map((t) => [t.id, t]));

  return entries.map((entry) => {
    let next = entry;
    if (!next.project) {
      const project = projectsById.get(entry.project_id);
      if (project) {
        next = {
          ...next,
          project: {
            id: project.id,
            title: project.title,
            client_id: project.client_id ?? null,
            hourly_rate: project.hourly_rate == null ? null : Number(project.hourly_rate),
          },
        };
      }
    }
    if (!next.task && entry.task_id) {
      const task = tasksById.get(entry.task_id);
      if (task) {
        next = { ...next, task: { id: task.id, title: task.title } };
      }
    }
    return next;
  });
}

async function normalizeHydratedTimeEntry(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  userId: string,
  raw: TimeEntryRowRaw & { projects?: unknown; tasks?: unknown },
): Promise<TimeEntryListRow> {
  const entry = normalizeTimeEntryListRow(raw);
  const [hydrated] = await hydrateTimeEntriesWithRelations(supabase, userId, [
    entry,
  ]);
  return hydrated;
}

const timeEntrySelect = `
  *,
  projects:project_id ( id, title, client_id, hourly_rate ),
  tasks:task_id ( id, title )
`;

export type ListTimeEntriesResult =
  | { ok: true; entries: TimeEntryListRow[] }
  | { ok: false; message: string };

export async function listTimeEntries(): Promise<ListTimeEntriesResult> {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data, error } = await supabase
    .from("time_entries")
    .select(timeEntrySelect)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) {
    return { ok: false, message: error.message };
  }

  const entries = (data ?? []).map((row) =>
    normalizeTimeEntryListRow(
      row as TimeEntryRowRaw & { projects?: unknown; tasks?: unknown },
    ),
  );

  return {
    ok: true,
    entries: await hydrateTimeEntriesWithRelations(supabase, user.id, entries),
  };
}

const _cachedListTimeEntriesForProject = unstable_cache(
  async (
    userId: string,
    projectId: string,
  ): Promise<ListTimeEntriesResult> => {
    const { supabase } = await getServerContext();
    const owned = await projectBelongsToUser(supabase, userId, projectId);
    if (!owned) {
      return { ok: false, message: "Project not found." };
    }

    const { data, error } = await supabase
      .from("time_entries")
      .select(timeEntrySelect)
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("started_at", { ascending: false });

    if (error) {
      return { ok: false, message: error.message };
    }

    const entries = (data ?? []).map((row) =>
      normalizeTimeEntryListRow(
        row as TimeEntryRowRaw & { projects?: unknown; tasks?: unknown },
      ),
    );

    return {
      ok: true,
      entries: await hydrateTimeEntriesWithRelations(supabase, userId, entries),
    };
  },
  ["project-time-entries-list"],
  { revalidate: 60, tags: ["time"] },
);

export async function listTimeEntriesForProject(
  projectId: string,
): Promise<ListTimeEntriesResult> {
  const parsedId = uuidSchema.safeParse(projectId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid project." };
  }

  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }

  return _cachedListTimeEntriesForProject(user.id, parsedId.data);
}

export type CreateManualTimeEntryResult =
  | { ok: true; entry: TimeEntryListRow }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function createManualTimeEntry(
  input: unknown,
): Promise<CreateManualTimeEntryResult> {
  const parsed = parseTimeEntryManualCompleteInput(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: flat.fieldErrors as Record<string, string[] | undefined>,
    };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const owned = await projectBelongsToUser(
    supabase,
    user.id,
    parsed.data.project_id,
  );
  if (!owned) {
    return { ok: false, message: "Project not found." };
  }

  const insertPayload = {
    user_id: user.id,
    project_id: parsed.data.project_id,
    task_id: parsed.data.task_id,
    description: parsed.data.description,
    started_at: parsed.data.started_at,
    ended_at: parsed.data.ended_at,
    duration_seconds: parsed.data.duration_seconds,
    billed: false,
  };

  const { data, error } = await supabase
    .from("time_entries")
    .insert(insertPayload)
    .select(timeEntrySelect)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Time entry could not be created." };
  }

  revalidateTimePaths();

  return {
    ok: true,
    entry: await normalizeHydratedTimeEntry(
      supabase,
      user.id,
      data as TimeEntryRowRaw & { projects?: unknown; tasks?: unknown },
    ),
  };
}

export type StartTimerResult =
  | { ok: true; entry: TimeEntryListRow }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function startTimer(input: unknown): Promise<StartTimerResult> {
  const parsed = parseTimeEntryStartInput(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: flat.fieldErrors as Record<string, string[] | undefined>,
    };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const owned = await projectBelongsToUser(
    supabase,
    user.id,
    parsed.data.project_id,
  );
  if (!owned) {
    return { ok: false, message: "Project not found." };
  }

  const insertPayload = {
    user_id: user.id,
    project_id: parsed.data.project_id,
    task_id: parsed.data.task_id,
    description: parsed.data.description,
    started_at: parsed.data.started_at,
    ended_at: null,
    paused_at: null,
    total_paused_seconds: 0,
    duration_seconds: null,
    billed: false,
  };

  const { data, error } = await supabase
    .from("time_entries")
    .insert(insertPayload)
    .select(timeEntrySelect)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        message: "You already have a timer running. Stop it before starting another.",
      };
    }
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Timer could not be started." };
  }

  revalidateTimePaths();

  return {
    ok: true,
    entry: await normalizeHydratedTimeEntry(
      supabase,
      user.id,
      data as TimeEntryRowRaw & { projects?: unknown; tasks?: unknown },
    ),
  };
}

export type StopTimerResult =
  | { ok: true; entry: TimeEntryListRow }
  | { ok: false; message: string };

export async function stopTimer(): Promise<StopTimerResult> {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: open, error: fetchError } = await supabase
    .from("time_entries")
    .select("id, started_at, paused_at, total_paused_seconds")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }

  if (!open) {
    return { ok: false, message: "No running timer." };
  }

  const endedAt = new Date().toISOString();
  const duration_seconds = computeStoppedDurationSeconds({
    started_at: open.started_at,
    ended_at: endedAt,
    total_paused_seconds: normalizeTotalPausedSeconds(
      open.total_paused_seconds,
    ),
    paused_at: open.paused_at,
  });

  const { data, error } = await supabase
    .from("time_entries")
    .update({
      ended_at: endedAt,
      duration_seconds,
      paused_at: null,
    })
    .eq("id", open.id)
    .select(timeEntrySelect)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Timer could not be stopped." };
  }

  revalidateTimePaths();

  return {
    ok: true,
    entry: await normalizeHydratedTimeEntry(
      supabase,
      user.id,
      data as TimeEntryRowRaw & { projects?: unknown; tasks?: unknown },
    ),
  };
}

export type UpdateRunningTimerDescriptionResult =
  | { ok: true; entry: TimeEntryListRow }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export async function updateRunningTimerDescription(
  input: unknown,
): Promise<UpdateRunningTimerDescriptionResult> {
  const parsed = parseUpdateRunningTimerDescriptionInput(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      message: "Validation failed.",
      fieldErrors: flat.fieldErrors as Record<string, string[] | undefined>,
    };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: open, error: fetchError } = await supabase
    .from("time_entries")
    .select("id")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }

  if (!open) {
    return { ok: false, message: "No running timer." };
  }

  const { data, error } = await supabase
    .from("time_entries")
    .update({ description: parsed.data.description })
    .eq("id", open.id)
    .select(timeEntrySelect)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Note could not be saved." };
  }

  revalidateTimePaths();

  return {
    ok: true,
    entry: await normalizeHydratedTimeEntry(
      supabase,
      user.id,
      data as TimeEntryRowRaw & { projects?: unknown; tasks?: unknown },
    ),
  };
}

export type PauseTimerResult =
  | { ok: true; entry: TimeEntryListRow }
  | { ok: false; message: string };

export async function pauseTimer(): Promise<PauseTimerResult> {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: open, error: fetchError } = await supabase
    .from("time_entries")
    .select("id, paused_at")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }

  if (!open) {
    return { ok: false, message: "No running timer." };
  }

  if (open.paused_at) {
    return { ok: false, message: "Timer is already paused." };
  }

  const pausedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("time_entries")
    .update({ paused_at: pausedAt })
    .eq("id", open.id)
    .select(timeEntrySelect)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Could not pause timer." };
  }

  revalidateTimePaths();

  return {
    ok: true,
    entry: await normalizeHydratedTimeEntry(
      supabase,
      user.id,
      data as TimeEntryRowRaw & { projects?: unknown; tasks?: unknown },
    ),
  };
}

export type ResumeTimerResult =
  | { ok: true; entry: TimeEntryListRow }
  | { ok: false; message: string };

export async function resumeTimer(): Promise<ResumeTimerResult> {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const { data: open, error: fetchError } = await supabase
    .from("time_entries")
    .select("id, paused_at, total_paused_seconds")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, message: fetchError.message };
  }

  if (!open) {
    return { ok: false, message: "No running timer." };
  }

  if (!open.paused_at) {
    return { ok: false, message: "Timer is not paused." };
  }

  const nowMs = Date.now();
  const pauseSegmentSeconds = Math.floor(
    (nowMs - new Date(open.paused_at).getTime()) / 1000,
  );
  const newTotal =
    normalizeTotalPausedSeconds(open.total_paused_seconds) +
    pauseSegmentSeconds;

  const { data, error } = await supabase
    .from("time_entries")
    .update({
      paused_at: null,
      total_paused_seconds: newTotal,
    })
    .eq("id", open.id)
    .select(timeEntrySelect)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Could not resume timer." };
  }

  revalidateTimePaths();

  return {
    ok: true,
    entry: await normalizeHydratedTimeEntry(
      supabase,
      user.id,
      data as TimeEntryRowRaw & { projects?: unknown; tasks?: unknown },
    ),
  };
}

const convertInput = z.object({
  entryIds: z.array(z.string().uuid()).min(1),
});

export async function convertTimeEntriesToInvoice(
  input: unknown,
): Promise<{ ok: boolean; documentId?: string; error?: string }> {
  const parsed = convertInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid selection." };
  const { entryIds } = parsed.data;

  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  // Fetch entries with the project fields billing needs.
  const { data: rows } = await supabase
    .from("time_entries")
    .select(
      "id, description, duration_seconds, billed, project:projects(id, title, client_id, hourly_rate)",
    )
    .in("id", entryIds)
    .eq("user_id", user.id);

  if (!rows || rows.length === 0) return { ok: false, error: "No entries found." };

  const entries: BillableEntry[] = rows.map((r) => {
    const project = Array.isArray(r.project) ? r.project[0] : r.project;
    return {
      id: r.id,
      description: r.description,
      durationSeconds:
        r.duration_seconds === null ? null : Number(r.duration_seconds),
      billed: r.billed,
      project: project
        ? {
            id: project.id,
            title: project.title,
            clientId: project.client_id ?? null,
            hourlyRate:
              project.hourly_rate === null ? null : Number(project.hourly_rate),
          }
        : null,
    };
  });

  const check = validateBillingSelection(entries);
  if (!check.ok) {
    const messages: Record<typeof check.error, string> = {
      empty: "Select at least one entry.",
      mixed_client: "All selected entries must belong to the same client.",
      already_billed: "Some entries are already billed.",
      no_client: "Every entry must belong to a project with a client.",
    };
    return { ok: false, error: messages[check.error] };
  }

  const clientId = entries[0].project!.clientId!;

  // Due date from client payment terms (mirrors createInvoiceFromLpo).
  const { data: client } = await supabase
    .from("clients")
    .select("payment_terms_days, currency")
    .eq("id", clientId)
    .eq("user_id", user.id)
    .maybeSingle();
  const dueDate = computeDueDate(new Date().toISOString(), client?.payment_terms_days);

  const invoiceNumber = await nextDocumentNumber(supabase, user.id, "invoice");

  const uniqueProjectIds = [...new Set(entries.map((e) => e.project!.id))];
  const projectId = uniqueProjectIds.length === 1 ? uniqueProjectIds[0] : null;

  const { data: newInvoice, error: insertError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      type: "invoice",
      status: "draft",
      title: "Time invoice",
      client_id: clientId,
      project_id: projectId,
      content_json: emptyTiptapDoc(),
      invoice_number: invoiceNumber,
      currency: client?.currency ?? null,
      due_date: dueDate,
    })
    .select("id")
    .single();

  if (insertError || !newInvoice) {
    return { ok: false, error: insertError?.message ?? "Failed to create invoice." };
  }

  const lineInputs = buildLineItemsFromEntries(entries);
  const { data: insertedLines, error: lineError } = await supabase
    .from("line_items")
    .insert(lineInputs.map((li) => ({ document_id: newInvoice.id, ...li })))
    .select("id, sort_order");

  if (lineError || !insertedLines) {
    return { ok: false, error: lineError?.message ?? "Failed to add line items." };
  }

  // Back-link each entry to its line item (matched by sort_order = selection index).
  const lineBySort = new Map(insertedLines.map((l) => [l.sort_order, l.id]));
  const updateResults = await Promise.all(
    entries.map((entry, i) => {
      const lineId = lineBySort.get(i);
      if (!lineId) return Promise.resolve({ error: new Error("Line item mapping failed.") });
      return supabase
        .from("time_entries")
        .update({ billed: true, invoice_line_item_id: lineId })
        .eq("id", entry.id)
        .eq("user_id", user.id);
    }),
  );
  const updateError = updateResults.find((r) => r && "error" in r && r.error);
  if (updateError && "error" in updateError && updateError.error) {
    return {
      ok: false,
      error:
        updateError.error instanceof Error
          ? updateError.error.message
          : (updateError.error as { message?: string }).message ??
            "Failed to link time entries.",
    };
  }

  revalidatePath("/time");
  revalidatePath("/documents");
  revalidateTag("time");
  revalidateTag("documents");
  revalidateTag("dashboard");
  revalidateTag("finance");

  return { ok: true, documentId: newInvoice.id };
}
