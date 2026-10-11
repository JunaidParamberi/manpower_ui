import { describe, expect, it } from "vitest";

import { sumExpensesByCategory } from "@/lib/expenses/expense-summary";
import type { ExpenseListRow } from "@/types";

function row(
  partial: Pick<ExpenseListRow, "category" | "amount">,
): Pick<ExpenseListRow, "category" | "amount"> {
  return partial;
}

describe("sumExpensesByCategory", () => {
  it("returns zero totals for empty list", () => {
    const result = sumExpensesByCategory([]);
    expect(result.grandTotal).toBe(0);
    expect(result.expenseCount).toBe(0);
    expect(result.byCategory).toHaveLength(0);
  });

  it("sums by category and grand total", () => {
    const result = sumExpensesByCategory([
      row({ category: "software", amount: 50 }),
      row({ category: "software", amount: 25 }),
      row({ category: "travel", amount: 100 }),
    ]);
    expect(result.grandTotal).toBe(175);
    expect(result.expenseCount).toBe(3);
    expect(result.byCategory).toHaveLength(2);
    const software = result.byCategory.find((c) => c.category === "software");
    expect(software?.total).toBe(75);
    expect(software?.count).toBe(2);
  });
});
