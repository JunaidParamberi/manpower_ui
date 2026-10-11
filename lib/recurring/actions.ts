"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getServerContext } from "@/lib/supabase/get-server-context";
import {
  recurringInvoiceSchema,
  invoiceRecurringScheduleSchema,
  type RecurringInvoiceInput,
  type InvoiceRecurringScheduleInput,
} from "@/lib/validations/recurring-invoice";
import { advanceDate, nextDueOnOrAfter, periodFor } from "@/lib/recurring/schedule";
import type { Interval } from "@/lib/recurring/schedule";
import { getInvoiceWithLineItems } from "@/lib/documents/invoice-queries";
import type { RecurringInvoiceRow } from "@/types";

const uuidSchema = z.string().uuid();

type RecurringResult =
  | { ok: true; recurring: RecurringInvoiceRow }
  | { ok: false; error: string };

type OkResult = { ok: true } | { ok: false; error: string };

function revalidate(documentId?: string) {
  revalidateTag("recurring");
  revalidatePath("/documents");
  revalidatePath("/documents/invoices");
  if (documentId) {
    revalidatePath(`/documents/${documentId}`);
    revalidatePath(`/documents/${documentId}/edit`);
  }
}

async function resolveCurrency(
  supabase: Awaited<ReturnType<typeof getServerContext>>["supabase"],
  userId: string,
  clientId: string,
  override?: string,
): Promise<string> {
  if (override?.trim()) return override.trim().toUpperCase();

  const { data: clientRow } = await supabase
    .from("clients")
    .select("currency")
    .eq("id", clientId)
    .eq("user_id", userId)
    .maybeSingle();

  const fromClient = clientRow?.currency?.trim();
  if (fromClient) return fromClient.toUpperCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_currency")
    .eq("id", userId)
    .maybeSingle();

  return profile?.default_currency?.trim()?.toUpperCase() || "USD";
}

function toInsertRow(
  userId: string,
  data: RecurringInvoiceInput,
  currency: string,
  nextRunAt: string,
  options?: {
    sourceDocumentId?: string;
    occurrencesCount?: number;
  },
) {
  return {
    user_id: userId,
    client_id: data.client_id,
    project_id: data.project_id ?? null,
    title: data.title,
    status: "active" as const,
    interval: data.interval,
    interval_count: data.interval_count,
    start_date: data.start_date,
    next_run_at: nextRunAt,
    end_date: data.end_date ?? null,
    occurrences_limit: data.occurrences_limit ?? null,
    auto_send: data.auto_send,
    net_days: data.net_days,
    currency,
    tax_mode: data.tax_mode,
    tax_rate: data.tax_rate,
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    notes_footer: data.notes_footer ?? null,
    payment_terms: data.payment_terms ?? null,
    line_items: data.line_items.map((item) => ({
      description: item.description,
      notes: item.notes ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      hsn_sac_code: item.hsn_sac_code ?? null,
    })),
    ...(options?.sourceDocumentId
      ? { source_document_id: options.sourceDocumentId }
      : {}),
    ...(options?.occurrencesCount !== undefined
      ? { occurrences_count: options.occurrencesCount }
      : {}),
  };
}

function invoiceToScheduleInput(
  invoice: NonNullable<Awaited<ReturnType<typeof getInvoiceWithLineItems>>>,
  schedule: InvoiceRecurringScheduleInput,
): RecurringInvoiceInput {
  return {
    client_id: invoice.client_id!,
    project_id: invoice.project_id,
    title: invoice.title,
    interval: schedule.interval,
    interval_count: schedule.interval_count,
    start_date: schedule.start_date,
    end_date: null,
    occurrences_limit: null,
    auto_send: schedule.auto_send,
    net_days: schedule.net_days,
    currency: invoice.currency,
    tax_mode: invoice.tax_mode,
    tax_rate: invoice.tax_rate,
    discount_type: invoice.discount_type,
    discount_value: invoice.discount_value,
    notes_footer: invoice.notes_footer,
    payment_terms: invoice.payment_terms,
    line_items: invoice.line_items.map((item) => ({
      description: item.description,
      notes: item.notes,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      hsn_sac_code: item.hsn_sac_code,
    })),
  };
}

export async function createRecurringInvoice(
  raw: unknown,
): Promise<RecurringResult> {
  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = recurringInvoiceSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const currency = await resolveCurrency(
    supabase,
    user.id,
    parsed.data.client_id,
    parsed.data.currency,
  );

  const { data, error } = await supabase
    .from("recurring_invoices")
    .insert(
      toInsertRow(user.id, parsed.data, currency, parsed.data.start_date),
    )
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true, recurring: data as RecurringInvoiceRow };
}

export async function updateRecurringInvoice(
  id: string,
  raw: unknown,
): Promise<RecurringResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const parsed = recurringInvoiceSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { data: existing } = await supabase
    .from("recurring_invoices")
    .select("occurrences_count, interval, interval_count, start_date, status")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Schedule not found." };
  if (existing.status === "cancelled") {
    return { ok: false, error: "Cancelled schedules cannot be edited." };
  }

  const currency = await resolveCurrency(
    supabase,
    user.id,
    parsed.data.client_id,
    parsed.data.currency,
  );

  const cadenceChanged =
    existing.interval !== parsed.data.interval ||
    existing.interval_count !== parsed.data.interval_count ||
    existing.start_date !== parsed.data.start_date;

  let nextRunAt: string | undefined;
  if (cadenceChanged && existing.occurrences_count === 0) {
    nextRunAt = parsed.data.start_date;
  }

  const { data, error } = await supabase
    .from("recurring_invoices")
    .update({
      client_id: parsed.data.client_id,
      project_id: parsed.data.project_id ?? null,
      title: parsed.data.title,
      interval: parsed.data.interval,
      interval_count: parsed.data.interval_count,
      start_date: parsed.data.start_date,
      ...(nextRunAt !== undefined ? { next_run_at: nextRunAt } : {}),
      end_date: parsed.data.end_date ?? null,
      occurrences_limit: parsed.data.occurrences_limit ?? null,
      auto_send: parsed.data.auto_send,
      net_days: parsed.data.net_days,
      currency,
      tax_mode: parsed.data.tax_mode,
      tax_rate: parsed.data.tax_rate,
      discount_type: parsed.data.discount_type,
      discount_value: parsed.data.discount_value,
      notes_footer: parsed.data.notes_footer ?? null,
      payment_terms: parsed.data.payment_terms ?? null,
      line_items: parsed.data.line_items.map((item) => ({
        description: item.description,
        notes: item.notes ?? null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        hsn_sac_code: item.hsn_sac_code ?? null,
      })),
    })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true, recurring: data as RecurringInvoiceRow };
}

export async function pauseRecurringInvoice(id: string): Promise<OkResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { error } = await supabase
    .from("recurring_invoices")
    .update({ status: "paused" })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function resumeRecurringInvoice(id: string): Promise<OkResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data: existing } = await supabase
    .from("recurring_invoices")
    .select("start_date, next_run_at, interval, interval_count, status")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Schedule not found." };
  if (existing.status !== "paused") {
    return { ok: false, error: "Only paused schedules can be resumed." };
  }

  const today = new Date().toISOString().slice(0, 10);
  const anchor = existing.next_run_at ?? existing.start_date;
  const nextRun = nextDueOnOrAfter(
    anchor,
    existing.interval as Interval,
    existing.interval_count,
    today,
  );

  const { error } = await supabase
    .from("recurring_invoices")
    .update({ status: "active", next_run_at: nextRun })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function cancelRecurringInvoice(id: string): Promise<OkResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { error } = await supabase
    .from("recurring_invoices")
    .update({ status: "cancelled", next_run_at: null })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .in("status", ["active", "paused"]);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function makeInvoiceRecurring(
  invoiceId: string,
  raw: unknown,
): Promise<RecurringResult> {
  const parsedId = uuidSchema.safeParse(invoiceId);
  if (!parsedId.success) return { ok: false, error: "Invalid invoice id" };

  const { user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const invoice = await getInvoiceWithLineItems(parsedId.data);
  if (!invoice || invoice.user_id !== user.id) {
    return { ok: false, error: "Invoice not found." };
  }
  if (!invoice.client_id) {
    return { ok: false, error: "Invoice must have a client." };
  }
  if (invoice.line_items.length === 0) {
    return { ok: false, error: "Invoice must have at least one line item." };
  }

  const scheduleInput = {
    ...(typeof raw === "object" && raw !== null ? raw : {}),
    client_id: invoice.client_id,
    project_id: invoice.project_id,
    title: invoice.title,
    currency: invoice.currency,
    tax_mode: invoice.tax_mode,
    tax_rate: invoice.tax_rate,
    discount_type: invoice.discount_type,
    discount_value: invoice.discount_value,
    notes_footer: invoice.notes_footer,
    payment_terms: invoice.payment_terms,
    line_items: invoice.line_items.map((item) => ({
      description: item.description,
      notes: item.notes,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      hsn_sac_code: item.hsn_sac_code,
    })),
  };

  return createRecurringInvoice(scheduleInput);
}

export async function upsertRecurringFromInvoice(
  invoiceId: string,
  raw: unknown,
): Promise<RecurringResult> {
  const parsedId = uuidSchema.safeParse(invoiceId);
  if (!parsedId.success) return { ok: false, error: "Invalid invoice id" };

  const parsedSchedule = invoiceRecurringScheduleSchema.safeParse(raw);
  if (!parsedSchedule.success) {
    return {
      ok: false,
      error: parsedSchedule.error.issues[0]?.message ?? "Invalid schedule",
    };
  }

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const invoice = await getInvoiceWithLineItems(parsedId.data);
  if (!invoice || invoice.user_id !== user.id) {
    return { ok: false, error: "Invoice not found." };
  }
  if (!invoice.client_id) {
    return { ok: false, error: "Invoice must have a client." };
  }
  if (invoice.line_items.length === 0) {
    return { ok: false, error: "Invoice must have at least one line item." };
  }
  if (invoice.recurring_invoice_id) {
    return {
      ok: false,
      error: "Generated invoices cannot own a recurring schedule.",
    };
  }

  const scheduleData = invoiceToScheduleInput(invoice, parsedSchedule.data);
  const currency = await resolveCurrency(
    supabase,
    user.id,
    scheduleData.client_id,
    scheduleData.currency,
  );

  const { data: existing } = await supabase
    .from("recurring_invoices")
    .select("id, occurrences_count, interval, interval_count, start_date, status")
    .eq("source_document_id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.status === "cancelled") {
    return {
      ok: false,
      error: "This invoice had a cancelled schedule. Create a new invoice to restart recurring billing.",
    };
  }

  const nextRunAt = advanceDate(
    parsedSchedule.data.start_date,
    parsedSchedule.data.interval,
    parsedSchedule.data.interval_count,
  );

  const templateUpdate = {
    client_id: scheduleData.client_id,
    project_id: scheduleData.project_id ?? null,
    title: scheduleData.title,
    interval: scheduleData.interval,
    interval_count: scheduleData.interval_count,
    start_date: scheduleData.start_date,
    auto_send: scheduleData.auto_send,
    net_days: scheduleData.net_days,
    currency,
    tax_mode: scheduleData.tax_mode,
    tax_rate: scheduleData.tax_rate,
    discount_type: scheduleData.discount_type,
    discount_value: scheduleData.discount_value,
    notes_footer: scheduleData.notes_footer ?? null,
    payment_terms: scheduleData.payment_terms ?? null,
    line_items: scheduleData.line_items.map((item) => ({
      description: item.description,
      notes: item.notes ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      hsn_sac_code: item.hsn_sac_code ?? null,
    })),
  };

  if (existing) {
    const cadenceChanged =
      existing.interval !== scheduleData.interval ||
      existing.interval_count !== scheduleData.interval_count ||
      existing.start_date !== scheduleData.start_date;

    let computedNextRun: string | undefined;
    if (cadenceChanged && existing.occurrences_count <= 1) {
      computedNextRun = nextRunAt;
    }

    const { data, error } = await supabase
      .from("recurring_invoices")
      .update({
        ...templateUpdate,
        status: "active",
        ...(computedNextRun !== undefined ? { next_run_at: computedNextRun } : {}),
      })
      .eq("id", existing.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    revalidate(parsedId.data);
    return { ok: true, recurring: data as RecurringInvoiceRow };
  }

  const { periodStart, periodEnd } = periodFor(
    parsedSchedule.data.start_date,
    parsedSchedule.data.interval,
    parsedSchedule.data.interval_count,
  );

  const { data: created, error: insertError } = await supabase
    .from("recurring_invoices")
    .insert(
      toInsertRow(user.id, scheduleData, currency, nextRunAt, {
        sourceDocumentId: parsedId.data,
        occurrencesCount: 1,
      }),
    )
    .select()
    .single();

  if (insertError || !created) {
    return { ok: false, error: insertError?.message ?? "Failed to create schedule." };
  }

  const { error: runError } = await supabase.from("recurring_invoice_runs").insert({
    recurring_invoice_id: created.id,
    user_id: user.id,
    document_id: parsedId.data,
    period_start: periodStart,
    period_end: periodEnd,
    status: "generated",
  });

  if (runError) {
    await supabase.from("recurring_invoices").delete().eq("id", created.id);
    return { ok: false, error: runError.message };
  }

  revalidate(parsedId.data);
  return { ok: true, recurring: created as RecurringInvoiceRow };
}

export async function cancelRecurringBySourceDocument(
  documentId: string,
): Promise<OkResult> {
  const parsedId = uuidSchema.safeParse(documentId);
  if (!parsedId.success) return { ok: false, error: "Invalid document id" };

  const { supabase, user } = await getServerContext();
  if (!user) return { ok: false, error: "Unauthenticated" };

  const { data: existing } = await supabase
    .from("recurring_invoices")
    .select("id")
    .eq("source_document_id", parsedId.data)
    .eq("user_id", user.id)
    .in("status", ["active", "paused"])
    .maybeSingle();

  if (!existing) return { ok: true };

  return cancelRecurringInvoice(existing.id);
}
