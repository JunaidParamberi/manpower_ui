import {
  EXPENSE_NONE_PROJECT_VALUE,
  type ExpenseCreateFormInput,
} from "@/lib/validations/expense";
import type { ExpenseRow } from "@/types";

export function expenseRowToFormValues(row: ExpenseRow): ExpenseCreateFormInput {
  return {
    category: row.category,
    amount: String(row.amount),
    currency: row.currency,
    date: row.date,
    project_id: row.project_id ?? EXPENSE_NONE_PROJECT_VALUE,
    vendor: row.vendor ?? "",
    notes: row.notes ?? "",
  };
}

export function emptyExpenseFormValues(
  defaultCurrency: string,
  defaultProjectId?: string | null,
): ExpenseCreateFormInput {
  const today = new Date().toISOString().slice(0, 10);
  return {
    category: "other",
    amount: "",
    currency: defaultCurrency,
    date: today,
    project_id: defaultProjectId ?? EXPENSE_NONE_PROJECT_VALUE,
    vendor: "",
    notes: "",
  };
}
