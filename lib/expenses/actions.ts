/**
 * Server queries for RSC pages. Client components should import mutations from
 * `expense-mutations.ts` directly to avoid pulling query code into the client bundle.
 */
export {
  getExpenseById,
  listExpenses,
  type ListExpensesOptions,
  type ListExpensesResult,
} from "@/lib/expenses/expense-queries";
