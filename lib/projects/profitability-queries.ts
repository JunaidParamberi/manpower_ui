import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type { DigestInvoiceInput } from "@/lib/projects/digest-facts";
import {
  mapProfitabilityInvoiceRows,
  type ProfitabilityInvoice,
  type ProfitabilityInvoiceRow,
} from "./project-profitability";

export const PROFITABILITY_CACHE_TAG = "project-profitability";

type ListInvoicesResult =
  | { ok: true; invoices: ProfitabilityInvoice[]; digestInvoices: DigestInvoiceInput[] }
  | { ok: false; message: string };

const _cachedListInvoicesWithPayments = unstable_cache(
  async (userId: string, projectId: string): Promise<ListInvoicesResult> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("documents")
      .select(
        "id, project_id, status, due_date, discount_value, discount_type, tax_mode, tax_rate, line_items(quantity, unit_price, tax_rate), payments!payments_document_id_fkey(amount), invoice_adjustments(amount, type)",
      )
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .eq("type", "invoice")
      .is("deleted_at", null);

    if (error) {
      return { ok: false, message: error.message };
    }

    const { invoices, digestInvoices } = mapProfitabilityInvoiceRows(
      (data ?? []) as ProfitabilityInvoiceRow[],
    );

    return { ok: true, invoices, digestInvoices };
  },
  ["invoices-with-payments-for-project"],
  { revalidate: 60, tags: ["documents", "payments", PROFITABILITY_CACHE_TAG] },
);

export async function listInvoicesWithPaymentsForProject(
  projectId: string,
): Promise<ListInvoicesResult> {
  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }
  return _cachedListInvoicesWithPayments(user.id, projectId);
}
