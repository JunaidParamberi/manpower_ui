import { EXPENSE_CATEGORY_LABELS } from "@/lib/validations/expense";
import type { ExpenseCategory } from "@/types";

export function expenseCategoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORY_LABELS[category];
}

export type ExpenseCategoryBadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive";

export function expenseCategoryBadgeVariant(
  category: ExpenseCategory,
): ExpenseCategoryBadgeVariant {
  switch (category) {
    case "travel":
    case "meals":
      return "secondary";
    case "marketing":
      return "outline";
    default:
      return "default";
  }
}
