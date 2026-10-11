import { unstable_cache } from "next/cache";
import { z } from "zod";

import {
  normalizeExpenseListRow,
  normalizeExpenseRow,
} from "@/lib/expenses/normalize-expense-row";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type { ExpenseListRow, ExpenseRow } from "@/types";

const uuidSchema = z.string().uuid();

export type ListExpensesOptions = {
  projectId?: string;
  from?: string;
  to?: string;
};

export type ListExpensesResult =
  | { ok: true; expenses: ExpenseListRow[] }
  | { ok: false; message: string };

const EXPENSE_LIST_SELECT =
  "*, project:projects(id, title)" as const;

const _cachedGetExpenseById = unstable_cache(
  async (userId: string, id: string): Promise<ExpenseRow | null> => {
    const parsedId = uuidSchema.safeParse(id);
    if (!parsedId.success) {
      return null;
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", parsedId.data)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return normalizeExpenseRow(data);
  },
  ["expense-by-id"],
  { revalidate: 60, tags: ["expenses"] }
);

export async function getExpenseById(id: string): Promise<ExpenseRow | null> {
  const { user } = await getServerContext();
  if (!user) return null;
  return _cachedGetExpenseById(user.id, id);
}

const _cachedListExpenses = unstable_cache(
  async (userId: string, optionsJson: string): Promise<ListExpensesResult> => {
    const supabase = createAdminClient();
    const options: ListExpensesOptions = JSON.parse(optionsJson);

    let query = supabase
      .from("expenses")
      .select(EXPENSE_LIST_SELECT)
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (options.projectId) {
      const projectId = uuidSchema.safeParse(options.projectId);
      if (!projectId.success) {
        return { ok: false, message: "Invalid project." };
      }
      query = query.eq("project_id", projectId.data);
    }

    if (options.from) {
      query = query.gte("date", options.from);
    }

    if (options.to) {
      query = query.lte("date", options.to);
    }

    const { data, error } = await query;

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      expenses: (data ?? []).map((row) => normalizeExpenseListRow(row)),
    };
  },
  ["expenses-list"],
  { revalidate: 60, tags: ["expenses"] }
);

export async function listExpenses(
  options: ListExpensesOptions = {},
): Promise<ListExpensesResult> {
  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }
  return _cachedListExpenses(user.id, JSON.stringify(options));
}
