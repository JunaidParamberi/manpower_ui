"use client";

import Link from "next/link";
import { Paperclip } from "lucide-react";

import {
  expenseCategoryBadgeVariant,
  expenseCategoryLabel,
} from "@/lib/expenses/display";
import { receiptFileLabel } from "@/lib/expenses/receipt-utils";
import { formatCurrency } from "@/lib/utils/format";
import type { ExpenseListRow } from "@/types";

import { ExpenseDeleteButton } from "@/components/features/expenses/expense-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ExpenseRowProps = {
  expense: ExpenseListRow;
  onEdit: (expense: ExpenseListRow) => void;
  showProject?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
};

function expenseReceiptUrls(expense: ExpenseListRow): string[] {
  if (expense.receipt_urls.length > 0) return expense.receipt_urls;
  if (expense.receipt_url) return [expense.receipt_url];
  return [];
}

export function ExpenseRow({
  expense,
  onEdit,
  showProject = true,
  isSelected = false,
  onToggleSelect,
}: ExpenseRowProps) {
  const label =
    expense.vendor?.trim() ||
    expenseCategoryLabel(expense.category) ||
    "Expense";

  const receiptUrls = expenseReceiptUrls(expense);

  return (
    <TableRow className={cn(isSelected && "bg-muted/50")}>
      {onToggleSelect !== undefined ? (
        <TableCell className="w-8 pe-0 ps-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${label}`}
            className="translate-y-px"
          />
        </TableCell>
      ) : null}
      <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
        {expense.date}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{label}</span>
          {expense.notes ? (
            <span className="line-clamp-1 text-muted-foreground text-xs">
              {expense.notes}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={expenseCategoryBadgeVariant(expense.category)}>
          {expenseCategoryLabel(expense.category)}
        </Badge>
      </TableCell>
      {showProject ? (
        <TableCell>
          {expense.project ? (
            <Link
              href={`/projects/${expense.project.id}`}
              className="text-primary text-sm underline-offset-4 hover:underline"
            >
              {expense.project.title}
            </Link>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </TableCell>
      ) : null}
      <TableCell className="text-end font-medium tabular-nums">
        {formatCurrency(expense.amount, expense.currency)}
      </TableCell>
      <TableCell className="text-end">
        <div className="flex items-center justify-end gap-1">
          {receiptUrls.length === 1 ? (
            <Button
              nativeButton={false}
              variant="ghost"
              size="icon-sm"
              aria-label="View attachment"
              render={
                <a
                  href={receiptUrls[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <Paperclip className="size-4" aria-hidden />
            </Button>
          ) : null}
          {receiptUrls.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="relative"
                    aria-label={`${receiptUrls.length} attachments`}
                  >
                    <Paperclip className="size-4" aria-hidden />
                    <Badge
                      variant="secondary"
                      className="pointer-events-none absolute -end-1 -top-1 size-4 justify-center rounded-full p-0 text-[10px]"
                    >
                      {receiptUrls.length}
                    </Badge>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-[12rem]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Attachments</DropdownMenuLabel>
                  {receiptUrls.map((url) => (
                    <DropdownMenuItem
                      key={url}
                      render={
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      }
                    >
                      <span className="truncate">{receiptFileLabel(url)}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(expense)}
          >
            Edit
          </Button>
          <ExpenseDeleteButton expenseId={expense.id} label={label} />
        </div>
      </TableCell>
    </TableRow>
  );
}
