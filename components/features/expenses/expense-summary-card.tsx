import { sumExpensesByCategory } from "@/lib/expenses/expense-summary";
import { formatCurrency } from "@/lib/utils/format";
import type { ExpenseListRow } from "@/types";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ExpenseSummaryCardProps = {
  expenses: ExpenseListRow[];
  defaultCurrency: string;
};

export function ExpenseSummaryCard({
  expenses,
  defaultCurrency,
}: ExpenseSummaryCardProps) {
  const summary = sumExpensesByCategory(expenses);
  const currency =
    expenses.find((e) => e.currency)?.currency ?? defaultCurrency;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-lg">Summary</CardTitle>
        <CardDescription>
          {summary.expenseCount === 0
            ? "No expenses in the current view."
            : `${summary.expenseCount} expense${summary.expenseCount === 1 ? "" : "s"} shown`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            Total
          </p>
          <p className="font-heading text-2xl font-semibold tabular-nums">
            {formatCurrency(summary.grandTotal, currency)}
          </p>
        </div>
        {summary.byCategory.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {summary.byCategory.map((row) => (
              <li key={row.category}>
                <Badge variant="secondary" className="gap-1.5 tabular-nums">
                  <span>{row.label}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(row.total, currency)}
                  </span>
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
