import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/validations/expense";
import type { ExpenseCategory, ExpenseListRow } from "@/types";

export type ExpenseCategoryTotal = {
  category: ExpenseCategory;
  label: string;
  total: number;
  count: number;
};

export type ExpenseSummaryResult = {
  grandTotal: number;
  expenseCount: number;
  byCategory: ExpenseCategoryTotal[];
};

/** Sum expenses by category for summary display (pure, no I/O). */
export function sumExpensesByCategory(
  expenses: Pick<ExpenseListRow, "category" | "amount">[],
): ExpenseSummaryResult {
  const totals = new Map<ExpenseCategory, { total: number; count: number }>();

  for (const cat of EXPENSE_CATEGORIES) {
    totals.set(cat, { total: 0, count: 0 });
  }

  let grandTotal = 0;

  for (const row of expenses) {
    const entry = totals.get(row.category);
    if (!entry) continue;
    entry.total += row.amount;
    entry.count += 1;
    grandTotal += row.amount;
  }

  const byCategory: ExpenseCategoryTotal[] = EXPENSE_CATEGORIES.map(
    (category) => {
      const { total, count } = totals.get(category) ?? { total: 0, count: 0 };
      return {
        category,
        label: EXPENSE_CATEGORY_LABELS[category],
        total,
        count,
      };
    },
  ).filter((row) => row.count > 0);

  return {
    grandTotal,
    expenseCount: expenses.length,
    byCategory,
  };
}
