import { z } from "zod";

import type { ExpenseCategory } from "@/types";

export const EXPENSE_CATEGORIES = [
  "housing",
  "software",
  "travel",
  "meals",
  "marketing",
  "other",
] as const satisfies readonly ExpenseCategory[];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  housing: "Housing",
  software: "Software",
  travel: "Travel",
  meals: "Meals",
  marketing: "Marketing",
  other: "Other",
};

export const EXPENSE_LIMITS = {
  vendor: 200,
  notes: 8000,
  amountMax: 9_999_999.99,
} as const;

export const EXPENSE_RECEIPT_ALLOWED_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export const EXPENSE_RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

const NONE_PROJECT = "__none";

const expenseCategorySchema = z.enum(EXPENSE_CATEGORIES);

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date (YYYY-MM-DD).");

const amountSchema = z.coerce
  .number()
  .positive("Amount must be greater than zero.")
  .max(EXPENSE_LIMITS.amountMax, "Amount is too large.");

const currencySchema = z
  .string()
  .trim()
  .length(3, "Use a 3-letter ISO currency code.")
  .regex(/^[A-Za-z]{3}$/, "Use a 3-letter ISO currency code.")
  .transform((v) => v.toUpperCase());

const projectIdSchema = z.union([
  z.literal(""),
  z.literal(NONE_PROJECT),
  z.string().uuid(),
]);

export const expenseCreateSchema = z.object({
  category: expenseCategorySchema,
  amount: amountSchema,
  currency: currencySchema,
  date: isoDateSchema,
  project_id: projectIdSchema,
  vendor: z.string().trim().max(EXPENSE_LIMITS.vendor),
  notes: z.string().trim().max(EXPENSE_LIMITS.notes),
});

export type ExpenseCreateFormInput = z.input<typeof expenseCreateSchema>;

export type ExpenseCreatePayload = {
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  project_id: string | null;
  vendor: string | null;
  notes: string | null;
};

export type ExpenseUpdatePayload = ExpenseCreatePayload & {
  id: string;
};

export function parseExpenseCreateInput(
  raw: unknown,
):
  | { success: true; data: ExpenseCreatePayload }
  | { success: false; error: z.ZodError } {
  const parsed = expenseCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const d = parsed.data;
  const projectRaw = d.project_id;
  const project_id =
    projectRaw === "" || projectRaw === NONE_PROJECT ? null : projectRaw;

  const vendorTrim = d.vendor.trim();
  const notesTrim = d.notes.trim();

  return {
    success: true,
    data: {
      category: d.category,
      amount: d.amount,
      currency: d.currency,
      date: d.date,
      project_id,
      vendor: vendorTrim === "" ? null : vendorTrim,
      notes: notesTrim === "" ? null : notesTrim,
    },
  };
}

export function parseExpenseUpdateInput(
  raw: unknown,
):
  | { success: true; data: ExpenseUpdatePayload }
  | { success: false; error: z.ZodError } {
  const withId = z
    .object({
      id: z.string().uuid("Invalid expense."),
    })
    .and(expenseCreateSchema);

  const parsed = withId.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error };
  }

  const create = parseExpenseCreateInput(parsed.data);
  if (!create.success) {
    return create;
  }

  return {
    success: true,
    data: {
      id: parsed.data.id,
      ...create.data,
    },
  };
}

export const EXPENSE_NONE_PROJECT_VALUE = NONE_PROJECT;
