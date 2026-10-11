"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { format, parseISO } from "date-fns";

import { getServerContext } from "@/lib/supabase/get-server-context";
import {
  importBillingSchema,
  previewBillingSchema,
} from "@/lib/validations/import-billing";

import { groupEntriesByDay } from "./import-billing";

export type DayPreview = { date: string; hours: number; amount: number };
export type PreviewResult =
  | { ok: true; days: DayPreview[] }
  | { ok: false; error: string };
export type ImportResult =
  | { ok: true; lineCount: number }
  | { ok: false; error: string };

function formatLineDescription(isoDate: string): string {
  return `Work — ${format(parseISO(isoDate), "d MMM yyyy")}`;
}

function roundHours(seconds: number): number {
  return Math.round((seconds / 3600) * 100) / 100;
}

export async function getUnbilledPreview(raw: unknown): Promise<PreviewResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = previewBillingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { project_id, date_from, date_to } = parsed.data;

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (projectError || !project) return { ok: false, error: "Project not found." };

  const { data: entries, error: entriesError } = await supabase
    .from("time_entries")
    .select("id, started_at, duration_seconds")
    .eq("project_id", project_id)
    .eq("user_id", user.id)
    .eq("billed", false)
    .not("ended_at", "is", null)
    .gte("started_at", `${date_from}T00:00:00Z`)
    .lte("started_at", `${date_to}T23:59:59Z`)
    .order("started_at", { ascending: true });

  if (entriesError) return { ok: false, error: entriesError.message };

  const completed = (entries ?? []).filter(
    (entry): entry is { id: string; started_at: string; duration_seconds: number } =>
      entry.duration_seconds !== null,
  );

  const groups = groupEntriesByDay(completed);

  return {
    ok: true,
    days: groups.map((group) => ({
      date: group.date,
      hours: roundHours(group.totalSeconds),
      amount: 0,
    })),
  };
}

export async function importBillableTime(raw: unknown): Promise<ImportResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = importBillingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { invoice_id, project_id, date_from, date_to, hourly_rate } = parsed.data;

  const { data: doc } = await supabase
    .from("documents")
    .select("id, status")
    .eq("id", invoice_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!doc) return { ok: false, error: "Invoice not found." };
  if (doc.status !== "draft") {
    return { ok: false, error: "Only draft invoices can have time imported." };
  }

  const { data: entries, error: entriesError } = await supabase
    .from("time_entries")
    .select("id, started_at, duration_seconds")
    .eq("project_id", project_id)
    .eq("user_id", user.id)
    .eq("billed", false)
    .not("ended_at", "is", null)
    .gte("started_at", `${date_from}T00:00:00Z`)
    .lte("started_at", `${date_to}T23:59:59Z`)
    .order("started_at", { ascending: true });

  if (entriesError) return { ok: false, error: entriesError.message };

  const completed = (entries ?? []).filter(
    (entry): entry is { id: string; started_at: string; duration_seconds: number } =>
      entry.duration_seconds !== null,
  );

  if (completed.length === 0) return { ok: true, lineCount: 0 };

  const groups = groupEntriesByDay(completed);

  const { data: existingLines } = await supabase
    .from("line_items")
    .select("sort_order")
    .eq("document_id", invoice_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  let nextSortOrder = (existingLines?.[0]?.sort_order ?? -1) + 1;
  let lineCount = 0;

  for (const group of groups) {
    const hours = roundHours(group.totalSeconds);

    const { data: line, error: lineError } = await supabase
      .from("line_items")
      .insert({
        document_id: invoice_id,
        description: formatLineDescription(group.date),
        notes: null,
        quantity: hours,
        unit_price: hourly_rate,
        tax_rate: 0,
        hsn_sac_code: null,
        sort_order: nextSortOrder,
      })
      .select("id")
      .single();

    if (lineError || !line) continue;

    nextSortOrder += 1;
    lineCount += 1;

    await supabase
      .from("time_entries")
      .update({ billed: true, invoice_line_item_id: line.id })
      .in("id", group.entryIds)
      .eq("user_id", user.id);
  }

  revalidateTag("line-items");
  revalidateTag("time");
  revalidatePath(`/documents/${invoice_id}`);

  return { ok: true, lineCount };
}
