"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

import { normalizeExpenseRow } from "@/lib/expenses/normalize-expense-row";
import {
  appendReceiptUrls,
  MAX_EXPENSE_RECEIPTS,
  normalizeReceiptUrls,
  removeReceiptUrl,
} from "@/lib/expenses/receipt-utils";
import { extFromReceiptMime, extractReceiptStoragePath } from "@/lib/expenses/utils";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import {
  EXPENSE_RECEIPT_ALLOWED_MIME,
  EXPENSE_RECEIPT_MAX_BYTES,
  parseExpenseCreateInput,
  parseExpenseUpdateInput,
} from "@/lib/validations/expense";
import type { ExpenseRow } from "@/types";

const uuidSchema = z.string().uuid();
const RECEIPT_BUCKET = "expense-receipts";

type MutationError = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type CreateExpenseResult =
  | { ok: true; expense: ExpenseRow }
  | MutationError;

export type UpdateExpenseResult =
  | { ok: true; expense: ExpenseRow }
  | MutationError;

export type DeleteExpenseResult =
  | { ok: true }
  | { ok: false; message: string };

export type ReceiptMutationResult =
  | { ok: true; expense: ExpenseRow }
  | { ok: false; message: string };

function revalidateExpensePaths(projectId: string | null) {
  revalidatePath("/expenses");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  revalidateTag("expenses");
}

async function removeReceiptsFromStorage(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  urls: string[],
) {
  const paths = urls
    .map((url) => extractReceiptStoragePath(url))
    .filter((p): p is string => Boolean(p));
  if (paths.length === 0) return;
  await supabase.storage.from(RECEIPT_BUCKET).remove(paths);
}

function parseReceiptFiles(formData: FormData): File[] {
  const files: File[] = [];
  const multi = formData.getAll("receipt");
  for (const entry of multi) {
    if (entry instanceof File && entry.size > 0) {
      files.push(entry);
    }
  }
  const legacy = formData.get("receipt");
  if (legacy instanceof File && legacy.size > 0 && !files.includes(legacy)) {
    files.push(legacy);
  }
  return files;
}

function validateReceiptFile(file: File): string | null {
  if (!EXPENSE_RECEIPT_ALLOWED_MIME.some((m) => m === file.type)) {
    return `${file.name}: must be PNG, JPEG, WebP, or PDF.`;
  }
  if (file.size > EXPENSE_RECEIPT_MAX_BYTES) {
    return `${file.name}: must be 5 MB or smaller.`;
  }
  if (!extFromReceiptMime(file.type)) {
    return `${file.name}: unsupported file type.`;
  }
  return null;
}

export async function createExpense(
  input: unknown,
): Promise<CreateExpenseResult> {
  const parsed = parseExpenseCreateInput(input);
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

  const payload = {
    user_id: user.id,
    project_id: parsed.data.project_id,
    category: parsed.data.category,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    date: parsed.data.date,
    vendor: parsed.data.vendor,
    notes: parsed.data.notes,
  };

  const { data, error } = await supabase
    .from("expenses")
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Expense could not be created." };
  }

  revalidateExpensePaths(parsed.data.project_id);

  return { ok: true, expense: normalizeExpenseRow(data) };
}

export async function updateExpense(
  input: unknown,
): Promise<UpdateExpenseResult> {
  const parsed = parseExpenseUpdateInput(input);
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

  const existing = await supabase
    .from("expenses")
    .select("project_id")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing.error || !existing.data) {
    return { ok: false, message: "Expense not found." };
  }

  const payload = {
    project_id: parsed.data.project_id,
    category: parsed.data.category,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    date: parsed.data.date,
    vendor: parsed.data.vendor,
    notes: parsed.data.notes,
  };

  const { data, error } = await supabase
    .from("expenses")
    .update(payload)
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data) {
    return { ok: false, message: "Expense could not be updated." };
  }

  revalidateExpensePaths(existing.data.project_id);
  if (parsed.data.project_id !== existing.data.project_id) {
    revalidateExpensePaths(parsed.data.project_id);
  }

  return { ok: true, expense: normalizeExpenseRow(data) };
}

export async function deleteExpense(id: string): Promise<DeleteExpenseResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid expense." };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const existing = await supabase
    .from("expenses")
    .select("receipt_url, receipt_urls, project_id")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing.error || !existing.data) {
    return { ok: false, message: "Expense not found." };
  }

  const urls = normalizeReceiptUrls(
    existing.data.receipt_urls,
    existing.data.receipt_url,
  );

  const { count, error } = await supabase
    .from("expenses")
    .delete({ count: "exact" })
    .eq("id", parsedId.data)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (count === 0) {
    return { ok: false, message: "Expense could not be deleted." };
  }

  await removeReceiptsFromStorage(supabase, urls);
  revalidateExpensePaths(existing.data.project_id);

  return { ok: true };
}

/** Upload one or more receipt files (FormData keys: `receipt`, repeated). */
export async function uploadExpenseReceipt(
  expenseId: string,
  formData: FormData,
): Promise<ReceiptMutationResult> {
  const parsedId = uuidSchema.safeParse(expenseId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid expense." };
  }

  const files = parseReceiptFiles(formData);
  if (files.length === 0) {
    return { ok: false, message: "Choose at least one file to upload." };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const existing = await supabase
    .from("expenses")
    .select("*")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing.error || !existing.data) {
    return { ok: false, message: "Expense not found." };
  }

  const currentUrls = normalizeReceiptUrls(
    existing.data.receipt_urls,
    existing.data.receipt_url,
  );

  if (currentUrls.length + files.length > MAX_EXPENSE_RECEIPTS) {
    return {
      ok: false,
      message: `You can attach up to ${MAX_EXPENSE_RECEIPTS} files per expense.`,
    };
  }

  const newUrls: string[] = [];

  for (const file of files) {
    const validationError = validateReceiptFile(file);
    if (validationError) {
      return { ok: false, message: validationError };
    }

    const ext = extFromReceiptMime(file.type);
    if (!ext) {
      return { ok: false, message: `${file.name}: unsupported file type.` };
    }

    const path = `${user.id}/${parsedId.data}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(RECEIPT_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      await removeReceiptsFromStorage(supabase, newUrls);
      return { ok: false, message: uploadError.message };
    }

    const { data: pub } = supabase.storage
      .from(RECEIPT_BUCKET)
      .getPublicUrl(path);
    newUrls.push(pub.publicUrl);
  }

  const merged = appendReceiptUrls(currentUrls, newUrls);
  const primaryUrl = merged[0] ?? null;

  const { data, error } = await supabase
    .from("expenses")
    .update({
      receipt_urls: merged,
      receipt_url: primaryUrl,
    })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    await removeReceiptsFromStorage(supabase, newUrls);
    return { ok: false, message: error?.message ?? "Could not save receipts." };
  }

  revalidateExpensePaths(data.project_id);

  return { ok: true, expense: normalizeExpenseRow(data) };
}

/** Remove one attachment by URL, or all when receiptUrl is omitted. */
export async function removeExpenseReceipt(
  expenseId: string,
  receiptUrl?: string,
): Promise<ReceiptMutationResult> {
  const parsedId = uuidSchema.safeParse(expenseId);
  if (!parsedId.success) {
    return { ok: false, message: "Invalid expense." };
  }

  const supabase = await createSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Not authenticated." };
  }

  const existing = await supabase
    .from("expenses")
    .select("*")
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing.error || !existing.data) {
    return { ok: false, message: "Expense not found." };
  }

  const currentUrls = normalizeReceiptUrls(
    existing.data.receipt_urls,
    existing.data.receipt_url,
  );

  const toRemove = receiptUrl
    ? currentUrls.filter((url) => url === receiptUrl)
    : currentUrls;

  if (toRemove.length === 0) {
    return { ok: false, message: "Receipt not found." };
  }

  await removeReceiptsFromStorage(supabase, toRemove);

  const nextUrls = receiptUrl
    ? removeReceiptUrl(currentUrls, receiptUrl)
    : [];

  const primaryUrl = nextUrls[0] ?? null;

  const { data, error } = await supabase
    .from("expenses")
    .update({
      receipt_urls: nextUrls,
      receipt_url: primaryUrl,
    })
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      message: error?.message ?? "Could not remove receipt.",
    };
  }

  revalidateExpensePaths(data.project_id);

  return { ok: true, expense: normalizeExpenseRow(data) };
}
