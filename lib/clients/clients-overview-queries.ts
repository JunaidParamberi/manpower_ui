import { unstable_cache } from "next/cache";

import { isOwedInvoiceStatus } from "@/lib/clients/client-financial-summary";
import { daysBetweenIso } from "@/lib/clients/health-facts";
import { normalizeClientRow } from "@/lib/clients/normalize-client-row";
import { calculateInvoiceTotal } from "@/lib/documents/payment-balance";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerContext } from "@/lib/supabase/get-server-context";
import type {
  ClientRow,
  DocumentStatus,
  DocumentType,
  LineItemRow,
  PaymentRow,
} from "@/types";

type OverviewLineItem = Pick<LineItemRow, "quantity" | "unit_price" | "tax_rate">;
type OverviewPaymentRow = Pick<PaymentRow, "amount">;

type OverviewProjectRow = {
  id: string;
  updated_at: string | null;
};

type OverviewDocumentRow = {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  title: string;
  invoice_number?: string | null;
  quote_number: string | null;
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  currency?: string | null;
  discount_type: string | null;
  discount_value: number | null;
  tax_mode?: string | null;
  tax_rate?: number | string | null;
  line_items: OverviewLineItem[] | null;
  payments: OverviewPaymentRow[] | null;
};

type ClientOverviewRaw = {
  id: string;
  user_id: string;
  name: string;
  contact_name?: string | null;
  website?: string | null;
  email: string | null;
  billing_email?: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  currency: string | null;
  tax_id?: string | null;
  payment_terms_days?: number | null;
  relationship_status?: string | null;
  lead_source?: string | null;
  preferred_contact_method?: string | null;
  timezone?: string | null;
  tags?: string[] | null;
  notes: string | null;
  health_score: number | null;
  portal_token?: string | null;
  created_at: string;
  updated_at: string;
  projects: OverviewProjectRow[] | null;
  documents: OverviewDocumentRow[] | null;
};

export type ClientOverviewDocument = {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  title: string;
  invoice_number: string | null;
  quote_number: string | null;
  receipt_number: string | null;
  amount: number;
  created_at: string;
};

export type ClientMoneyDue = {
  outstanding_total: number;
  overdue_total: number;
  /** Days the oldest unpaid invoice is past due; 0 when nothing is overdue. */
  overdue_days: number;
  /** Earliest due date among unpaid invoices (YYYY-MM-DD), or null. */
  next_due_date: string | null;
};

export type ClientOverviewRow = ClientRow &
  ClientMoneyDue & {
    projects_count: number;
    revenue_total: number;
    last_activity_at: string | null;
    recent_documents: ClientOverviewDocument[];
  };

export type ListClientsOverviewResult =
  | { ok: true; clients: ClientOverviewRow[] }
  | { ok: false; message: string };

function coerceDiscountType(value: string | null | undefined): "percent" | "flat" {
  return value === "percent" ? "percent" : "flat";
}

function getDocumentAmount(
  doc: Pick<OverviewDocumentRow, "discount_type" | "discount_value" | "tax_mode" | "tax_rate" | "line_items">,
): number {
  const items = doc.line_items ?? [];
  return calculateInvoiceTotal(items, Number(doc.discount_value ?? 0), coerceDiscountType(doc.discount_type), {
    taxMode: doc.tax_mode,
    taxRate: doc.tax_rate,
  });
}

export function sumClientInvoiceRevenue(
  documents: Array<Pick<OverviewDocumentRow, "type" | "status" | "discount_type" | "discount_value" | "tax_mode" | "tax_rate" | "line_items" | "payments">>,
): number {
  return documents.reduce((sum, doc) => {
    if (doc.type !== "invoice") {
      return sum;
    }
    const collected = (doc.payments ?? []).reduce(
      (paymentSum, payment) => paymentSum + Number(payment.amount),
      0,
    );
    if (collected > 0) {
      return sum + collected;
    }
    return doc.status === "paid" ? sum + getDocumentAmount(doc) : sum;
  }, 0);
}

function maxIso(values: Array<string | null | undefined>): string | null {
  const valid = values.filter((value): value is string => Boolean(value));
  if (valid.length === 0) {
    return null;
  }
  return valid.reduce((latest, value) => {
    return new Date(value).getTime() > new Date(latest).getTime() ? value : latest;
  });
}

export function getLatestClientActivityAt(input: {
  updated_at: string;
  projects: Array<Pick<OverviewProjectRow, "updated_at">> | null;
  documents: Array<Pick<OverviewDocumentRow, "created_at" | "updated_at">> | null;
}): string | null {
  return maxIso([
    input.updated_at,
    ...(input.projects ?? []).map((project) => project.updated_at),
    ...(input.documents ?? []).flatMap((document) => [
      document.created_at,
      document.updated_at,
    ]),
  ]);
}

type MoneyDueDocument = Pick<
  OverviewDocumentRow,
  "type" | "status" | "due_date" | "currency" | "discount_type" | "discount_value" | "tax_mode" | "tax_rate" | "line_items" | "payments"
>;

/** Owed amounts in the client's currency; invoices in another currency are left out. */
export function computeClientMoneyDue(
  documents: MoneyDueDocument[],
  nowIso: string,
  clientCurrency: string | null = null,
): ClientMoneyDue {
  const result: ClientMoneyDue = { outstanding_total: 0, overdue_total: 0, overdue_days: 0, next_due_date: null };
  const wanted = clientCurrency?.toUpperCase() ?? null;
  for (const doc of documents) {
    if (doc.type !== "invoice" || !isOwedInvoiceStatus(doc.status)) continue;
    if (wanted && doc.currency && doc.currency.toUpperCase() !== wanted) continue;
    const paid = (doc.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Math.max(0, getDocumentAmount(doc) - paid);
    if (balance <= 0) continue;
    result.outstanding_total += balance;
    if (!doc.due_date) continue;
    const due = doc.due_date.slice(0, 10);
    if (!result.next_due_date || due < result.next_due_date) result.next_due_date = due;
    const late = daysBetweenIso(due, nowIso);
    if (late > 0) {
      result.overdue_total += balance;
      result.overdue_days = Math.max(result.overdue_days, late);
    }
  }
  return result;
}

export function buildClientOverviewRow(
  row: ClientOverviewRaw,
  nowIso: string = new Date().toISOString(),
): ClientOverviewRow {
  const documents = row.documents ?? [];
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)
    .map((doc) => ({
      id: doc.id,
      type: doc.type,
      status: doc.status,
      title: doc.title,
      invoice_number: doc.invoice_number ?? null,
      quote_number: doc.quote_number,
      receipt_number: doc.receipt_number,
      amount: getDocumentAmount(doc),
      created_at: doc.created_at,
    }));

  return {
    ...normalizeClientRow(row),
    projects_count: row.projects?.length ?? 0,
    revenue_total: sumClientInvoiceRevenue(documents),
    ...computeClientMoneyDue(documents, nowIso, row.currency),
    last_activity_at: getLatestClientActivityAt(row),
    recent_documents: recentDocuments,
  };
}

export function countActiveClientsSince(
  clients: Array<Pick<ClientOverviewRow, "last_activity_at">>,
  thresholdIso: string,
): number {
  const threshold = new Date(thresholdIso).getTime();
  return clients.filter((client) => {
    if (!client.last_activity_at) {
      return false;
    }
    return new Date(client.last_activity_at).getTime() >= threshold;
  }).length;
}

const _cachedListClientsOverview = unstable_cache(
  async (userId: string): Promise<ListClientsOverviewResult> => {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("clients")
      .select(
        `
          *,
          projects(id, updated_at),
          documents(
            id,
            type,
            status,
            title,
            invoice_number,
            quote_number,
            receipt_number,
            created_at,
            updated_at,
            due_date,
            currency,
            discount_type,
            discount_value,
            tax_mode,
            tax_rate,
            line_items(quantity, unit_price, tax_rate),
            payments!payments_document_id_fkey(amount)
          )
        `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      clients: ((data ?? []) as ClientOverviewRaw[]).map((row) =>
        buildClientOverviewRow(row),
      ),
    };
  },
  ["clients-overview-list"],
  { revalidate: 60, tags: ["clients", "finance"] },
);

export async function listClientsOverview(): Promise<ListClientsOverviewResult> {
  const { user } = await getServerContext();
  if (!user) {
    return { ok: false, message: "Not authenticated." };
  }
  return _cachedListClientsOverview(user.id);
}
