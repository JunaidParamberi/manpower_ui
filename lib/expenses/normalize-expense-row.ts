import { normalizeReceiptUrls } from "@/lib/expenses/receipt-utils";
import type { ExpenseCategory, ExpenseListRow, ExpenseRow } from "@/types";

type ExpenseRowRaw = {
  id: string;
  user_id: string;
  project_id: string | null;
  category: string;
  amount: number | string;
  currency: string;
  date: string;
  vendor: string | null;
  notes: string | null;
  receipt_url?: string | null;
  receipt_urls?: unknown;
  created_at: string;
  updated_at: string;
};

type ExpenseListRowRaw = ExpenseRowRaw & {
  project?: { id: string; title: string } | { id: string; title: string }[] | null;
};

function parseAmount(amount: number | string): number {
  if (typeof amount === "number") return amount;
  const n = Number.parseFloat(amount);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeExpenseRow(row: ExpenseRowRaw): ExpenseRow {
  const receipt_urls = normalizeReceiptUrls(
    row.receipt_urls,
    row.receipt_url,
  );
  const legacyUrl = receipt_urls[0] ?? row.receipt_url ?? null;

  return {
    id: row.id,
    user_id: row.user_id,
    project_id: row.project_id,
    category: row.category as ExpenseCategory,
    amount: parseAmount(row.amount),
    currency: row.currency.trim().toUpperCase(),
    date: row.date,
    vendor: row.vendor,
    notes: row.notes,
    receipt_url: legacyUrl,
    receipt_urls,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function normalizeExpenseListRow(row: ExpenseListRowRaw): ExpenseListRow {
  const base = normalizeExpenseRow(row);
  const projectRaw = row.project;
  let project: ExpenseListRow["project"] = null;
  if (Array.isArray(projectRaw)) {
    project = projectRaw[0] ?? null;
  } else if (projectRaw) {
    project = projectRaw;
  }
  return { ...base, project };
}
