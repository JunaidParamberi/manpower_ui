"use client";

import { useMemo, useState, useTransition } from "react";
import {
  currentMonthRange,
  formatDateParam,
  lastNMonthsRange,
} from "@/lib/finance/date-utils";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_NONE_PROJECT_VALUE,
} from "@/lib/validations/expense";
import { deleteExpense } from "@/lib/expenses/expense-mutations";
import { useBulkSelection } from "@/hooks/use-bulk-selection";
import type { ExpenseCategory, ExpenseListRow, ProjectListRow } from "@/types";
import { Filter, Plus, ReceiptText, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ExpenseFormSheet } from "@/components/features/expenses/expense-form-sheet";
import { ExpenseRow } from "@/components/features/expenses/expense-row";
import { ExpenseSummaryCard } from "@/components/features/expenses/expense-summary-card";
import { BulkActionBar } from "@/components/shared/bulk-action-bar";
import { EmptyStateCard } from "@/components/shared/empty-state-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DatePreset = "month" | "quarter" | "all";

type ExpensesViewProps = {
  expenses: ExpenseListRow[];
  projects: ProjectListRow[];
  defaultCurrency: string;
  lockProjectId?: string | null;
  showProjectColumn?: boolean;
  title?: string;
  description?: string;
  showPageHeader?: boolean;
};

function matchesDatePreset(date: string, preset: DatePreset): boolean {
  if (preset === "all") return true;
  const range =
    preset === "month" ? currentMonthRange() : lastNMonthsRange(3);
  const from = formatDateParam(range.from);
  const to = formatDateParam(range.to);
  return date >= from && date <= to;
}

export function ExpensesView({
  expenses,
  projects,
  defaultCurrency,
  lockProjectId,
  showProjectColumn = true,
  title = "Expenses",
  description = "Track spending by category and project.",
  showPageHeader = false,
}: ExpensesViewProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">(
    "all",
  );
  const [projectFilter, setProjectFilter] = useState<string>(
    lockProjectId ?? "all",
  );
  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [editingExpense, setEditingExpense] = useState<ExpenseListRow | null>(
    null,
  );
  const [isBulkPending, startBulkTransition] = useTransition();

  const scopedExpenses = useMemo(() => {
    if (!lockProjectId) return expenses;
    return expenses.filter((e) => e.project_id === lockProjectId);
  }, [expenses, lockProjectId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scopedExpenses.filter((e) => {
      if (!matchesDatePreset(e.date, datePreset)) return false;
      if (categoryFilter !== "all" && e.category !== categoryFilter) {
        return false;
      }
      if (!lockProjectId && projectFilter !== "all") {
        if (projectFilter === EXPENSE_NONE_PROJECT_VALUE) {
          if (e.project_id !== null) return false;
        } else if (e.project_id !== projectFilter) {
          return false;
        }
      }
      if (!q) return true;
      const hay = [e.vendor, e.notes, e.category, e.project?.title]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [
    scopedExpenses,
    query,
    categoryFilter,
    projectFilter,
    datePreset,
    lockProjectId,
  ]);

  const bulk = useBulkSelection(filtered);

  function openCreate() {
    setSheetMode("create");
    setEditingExpense(null);
    setSheetOpen(true);
  }

  function openEdit(expense: ExpenseListRow) {
    setSheetMode("edit");
    setEditingExpense(expense);
    setSheetOpen(true);
  }

  function resetFilters() {
    setQuery("");
    setCategoryFilter("all");
    setProjectFilter(lockProjectId ?? "all");
    setDatePreset("all");
  }

  function bulkDelete() {
    const ids = [...bulk.selectedIds];
    startBulkTransition(async () => {
      const results = await Promise.all(ids.map((id) => deleteExpense(id)));
      const failed = results.filter((r) => !r.ok).length;
      bulk.clearSelection();
      if (failed > 0) {
        toast.error(`${failed} expense${failed > 1 ? "s" : ""} failed to delete.`);
      } else {
        toast.success(`${ids.length} expense${ids.length > 1 ? "s" : ""} deleted.`);
      }
    });
  }

  const datePresetLabel =
    datePreset === "month"
      ? "This month"
      : datePreset === "quarter"
        ? "Last 3 months"
        : "All time";

  return (
    <div className="flex flex-col gap-8">
      {showPageHeader ? (
        <PageHeader
          eyebrow="Finance"
          title="Expenses"
          description="Track business spending, attach receipts, and link costs to projects."
        />
      ) : null}

      <ExpenseSummaryCard
        expenses={filtered}
        defaultCurrency={defaultCurrency}
      />

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="font-heading text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button type="button" className="gap-2 shrink-0" onClick={openCreate}>
            <Plus className="size-4" />
            Add expense
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <InputGroup className="lg:max-w-sm">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search vendor or notes…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>

            <Select
              value={categoryFilter}
              onValueChange={(v) =>
                setCategoryFilter(v as ExpenseCategory | "all")
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue>
                  {categoryFilter === "all"
                    ? "All categories"
                    : EXPENSE_CATEGORY_LABELS[categoryFilter]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {EXPENSE_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {!lockProjectId ? (
              <Select
                value={projectFilter}
                onValueChange={(v) => setProjectFilter(v ?? "all")}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue>
                    {projectFilter === "all"
                      ? "All projects"
                      : projectFilter === EXPENSE_NONE_PROJECT_VALUE
                        ? "No project"
                        : (projects.find((p) => p.id === projectFilter)?.title ??
                          "Project")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All projects</SelectItem>
                    <SelectItem value={EXPENSE_NONE_PROJECT_VALUE}>
                      No project
                    </SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" className="gap-2">
                    <Filter className="size-4" />
                    {datePresetLabel}
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Date range</DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={datePreset}
                    onValueChange={(v) => setDatePreset(v as DatePreset)}
                  >
                    <DropdownMenuRadioItem value="month">
                      This month
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="quarter">
                      Last 3 months
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="all">
                      All time
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {filtered.length === 0 ? (
            <EmptyStateCard
              icon={ReceiptText}
              title={
                scopedExpenses.length === 0
                  ? "No expenses yet"
                  : "No expenses match filters"
              }
              description={
                scopedExpenses.length === 0
                  ? "Add an expense to track project costs and receipt attachments."
                  : "Clear the current filters to review all project spending."
              }
              action={
                scopedExpenses.length === 0 ? (
                  <Button type="button" size="sm" onClick={openCreate}>
                    <Plus />
                    Add expense
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                  >
                    <Filter />
                    Clear filters
                  </Button>
                )
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 pe-0 ps-3">
                    <Checkbox
                      checked={bulk.isAllSelected}
                      indeterminate={bulk.isIndeterminate}
                      onCheckedChange={bulk.toggleAll}
                      aria-label="Select all expenses"
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  {showProjectColumn ? <TableHead>Project</TableHead> : null}
                  <TableHead className="text-end">Amount</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    onEdit={openEdit}
                    showProject={showProjectColumn}
                    isSelected={bulk.selectedIds.has(expense.id)}
                    onToggleSelect={() => bulk.toggleRow(expense.id)}
                  />
                ))}
              </TableBody>
            </Table>

          )}
        </CardContent>
      </Card>

      <BulkActionBar count={bulk.count} onClearSelection={bulk.clearSelection}>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={bulkDelete}
          disabled={isBulkPending}
        >
          <Trash2 className="mr-1.5 size-3.5" />
          Delete
        </Button>
      </BulkActionBar>

      <ExpenseFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        defaultCurrency={defaultCurrency}
        projects={projects}
        expense={editingExpense}
        lockProjectId={lockProjectId}
      />
    </div>
  );
}
