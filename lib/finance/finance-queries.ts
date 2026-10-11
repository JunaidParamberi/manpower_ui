"use server";

import { unstable_cache } from "next/cache";
import { format, parseISO } from "date-fns";

import { getServerContext } from "@/lib/supabase/get-server-context";
import { normalizeDocumentListRow } from "@/lib/documents/normalize-document-row";
import type {
  DateRange,
  FinancialSummary,
  MonthlyRevenuePoint,
  SortKey,
  InvoiceFilters,
  FinanceInvoiceRow,
  PaginatedInvoices,
  AgingBucket,
  AgingReport,
  ClientRevenueRow,
} from "./types";
import {
  buildClientRevenueRows,
  type ClientRevenueSourceRow,
} from "./client-revenue";
import {
  buildMonthlyRevenueBuckets,
  calcAvgPayDays,
  calcRevenueChangePct,
} from "./revenue-calc";
import { calculateInvoiceTotal } from "@/lib/documents/payment-balance";
import { aggregateFinancialSummary } from "@/lib/finance/summary-calc";

function coerceDiscountType(val: string | null | undefined): "percent" | "flat" {
  return val === "flat" ? "flat" : "percent";
}

type LineItemLike = {
  quantity: number | string;
  unit_price: number | string;
  tax_rate: number | string | null;
};

function sortInvoices(invoices: FinanceInvoiceRow[], sort: SortKey): FinanceInvoiceRow[] {
  const underscoreIdx = sort.lastIndexOf("_");
  const field = sort.slice(0, underscoreIdx);
  const dir = sort.slice(underscoreIdx + 1) as "asc" | "desc";
  const asc = dir === "asc";

  return [...invoices].sort((a, b) => {
    switch (field) {
      case "date":
        return asc
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "amount":
        return asc ? a.computedTotal - b.computedTotal : b.computedTotal - a.computedTotal;
      case "client":
        return asc
          ? (a.client?.name ?? "").localeCompare(b.client?.name ?? "")
          : (b.client?.name ?? "").localeCompare(a.client?.name ?? "");
      case "status":
        return asc ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
      default:
        return 0;
    }
  });
}

import {
  previousPeriodRange,
  rangeCacheKey,
  rangeFromCacheKey,
} from "./date-utils";

// ---------------------------------------------------------------------------
// getFinancialSummary
// ---------------------------------------------------------------------------
const _cachedGetFinancialSummary = unstable_cache(
  async (userId: string, fromDay: string, toDay: string): Promise<FinancialSummary> => {
    const { supabase } = await getServerContext();
    const { from, to } = rangeFromCacheKey(fromDay, toDay);
    const prev = previousPeriodRange({ from, to });
    const now = new Date();

    const [paymentsRes, prevPaymentsRes, openInvoicesRes, profileRes, paidDocsRes] = await Promise.all([
      supabase
        .from("payments")
        .select("amount, currency")
        .eq("user_id", userId)
        .gte("paid_at", from.toISOString())
        .lte("paid_at", to.toISOString()),
      supabase
        .from("payments")
        .select("amount, currency")
        .eq("user_id", userId)
        .gte("paid_at", prev.from.toISOString())
        .lte("paid_at", prev.to.toISOString()),
      supabase
        .from("documents")
        .select(
          "id, due_date, currency, discount_value, discount_type, tax_mode, tax_rate, line_items(quantity, unit_price, tax_rate), payments!payments_document_id_fkey(amount), invoice_adjustments(amount, type)"
        )
        .eq("user_id", userId)
        .eq("type", "invoice")
        .in("status", ["sent", "viewed", "partially_paid"]),
      supabase.from("profiles").select("default_currency").eq("id", userId).maybeSingle(),
      supabase
        .from("documents")
        .select("sent_at, paid_at")
        .eq("user_id", userId)
        .eq("type", "invoice")
        .eq("status", "paid")
        .gte("paid_at", from.toISOString())
        .lte("paid_at", to.toISOString()),
    ]);

    const baseCurrency = profileRes.data?.default_currency?.trim() || "USD";

    const openInvoices = (openInvoicesRes.data ?? []).map((doc) => ({
      total: calculateInvoiceTotal(
        (doc.line_items ?? []) as LineItemLike[],
        Number(doc.discount_value ?? 0),
        coerceDiscountType(doc.discount_type),
        { taxMode: doc.tax_mode, taxRate: doc.tax_rate },
      ),
      paid: ((doc.payments ?? []) as Array<{ amount: number }>).reduce((s, p) => s + Number(p.amount), 0),
      writtenOff: ((doc.invoice_adjustments ?? []) as Array<{ amount: number; type: string }>)
        .filter((a) => a.type === "write_off")
        .reduce((s, a) => s + Number(a.amount), 0),
      currency: (doc.currency as string | null) ?? baseCurrency,
      dueDate: doc.due_date as string | null,
    }));

    const summary = aggregateFinancialSummary({
      baseCurrency,
      payments: (paymentsRes.data ?? []).map((p) => ({ amount: Number(p.amount), currency: p.currency })),
      openInvoices,
      now,
    });

    const prevSummary = aggregateFinancialSummary({
      baseCurrency,
      payments: (prevPaymentsRes.data ?? []).map((p) => ({ amount: Number(p.amount), currency: p.currency })),
      openInvoices: [],
      now,
    });

    // Compare like with like: the previous period's revenue in the SAME
    // currency the headline is being shown in, not its own primary bucket.
    const prevRevenue =
      prevSummary.byCurrency.find((c) => c.currency === summary.primaryCurrency)?.totalRevenue ?? 0;

    return {
      ...summary,
      baseCurrency,
      avgPayDays: calcAvgPayDays(
        (paidDocsRes.data ?? []).map((d) => ({ sent_at: d.sent_at, paid_at: d.paid_at }))
      ),
      revenueChangePct: calcRevenueChangePct(summary.totalRevenue, prevRevenue),
    };
  },
  ["finance-summary"],
  { revalidate: 60, tags: ["finance", "dashboard"] }
);

export async function getFinancialSummary(
  range: DateRange
): Promise<FinancialSummary> {
  const { user } = await getServerContext();
  if (!user) {
    return {
      primaryCurrency: "USD",
      totalRevenue: 0,
      outstanding: 0,
      overdue: 0,
      avgPayDays: null,
      revenueChangePct: null,
      overdueCount: 0,
      outstandingCount: 0,
      baseCurrency: "USD",
      byCurrency: [],
    };
  }
  const { fromDay, toDay } = rangeCacheKey(range);
  return _cachedGetFinancialSummary(user.id, fromDay, toDay);
}

// ---------------------------------------------------------------------------
// getMonthlyRevenue
//
// Sourced from `payments`, NOT from paid documents: partial payments, write
// -offs and multi-currency invoices all have to agree with the revenue KPI,
// which reads the same table. Document-derived revenue disagreed with it.
// ---------------------------------------------------------------------------
const _cachedGetMonthlyRevenue = unstable_cache(
  async (
    userId: string,
    fromDay: string,
    toDay: string,
    currency: string,
  ): Promise<MonthlyRevenuePoint[]> => {
    const { supabase } = await getServerContext();
    const { from, to } = rangeFromCacheKey(fromDay, toDay);

    const { data: payments, error } = await supabase
      .from("payments")
      .select("amount, paid_at")
      .eq("user_id", userId)
      .eq("currency", currency)
      .gte("paid_at", from.toISOString())
      .lte("paid_at", to.toISOString());

    if (error) console.error("[finance-queries] monthly revenue error:", error.message);

    const currentMonthKey = format(new Date(), "yyyy-MM");

    return buildMonthlyRevenueBuckets(
      (payments ?? []).map((p) => ({ amount: Number(p.amount), paid_at: p.paid_at as string })),
      currentMonthKey,
    ).map(({ monthKey, revenue }) => ({
      monthKey,
      month: format(parseISO(`${monthKey}-01`), "MMM yyyy"),
      revenue,
      isCurrent: monthKey === currentMonthKey,
    }));
  },
  ["finance-monthly"],
  { revalidate: 60, tags: ["finance"] }
);

export async function getMonthlyRevenue(
  range: DateRange,
  currency: string,
): Promise<MonthlyRevenuePoint[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  const { fromDay, toDay } = rangeCacheKey(range);
  return _cachedGetMonthlyRevenue(user.id, fromDay, toDay, currency);
}

// ---------------------------------------------------------------------------
// getRevenueByClient — also payments-sourced, for the same reason
// ---------------------------------------------------------------------------
const _cachedGetRevenueByClient = unstable_cache(
  async (
    userId: string,
    fromDay: string,
    toDay: string,
    currency: string,
  ): Promise<ClientRevenueRow[]> => {
    const { supabase } = await getServerContext();
    const { from, to } = rangeFromCacheKey(fromDay, toDay);

    const { data: payments, error } = await supabase
      .from("payments")
      .select("amount, documents!payments_document_id_fkey(client_id, clients:client_id(name))")
      .eq("user_id", userId)
      .eq("currency", currency)
      .gte("paid_at", from.toISOString())
      .lte("paid_at", to.toISOString());

    if (error) console.error("[finance-queries] client revenue error:", error.message);

    const rows: ClientRevenueSourceRow[] = (payments ?? []).map((payment) => {
      // The FK embed types as an array in generated types even though the
      // relationship is many-to-one; normalize both shapes.
      const embed = payment.documents as unknown as
        | { client_id: string | null; clients: { name: string } | { name: string }[] | null }
        | Array<{ client_id: string | null; clients: { name: string } | { name: string }[] | null }>
        | null;
      const doc = Array.isArray(embed) ? embed[0] : embed;
      return {
        client_id: doc?.client_id ?? null,
        clients: doc?.clients ?? null,
        amount: Number(payment.amount),
      };
    });

    return buildClientRevenueRows(rows);
  },
  ["finance-client-revenue"],
  { revalidate: 60, tags: ["finance"] }
);

export async function getRevenueByClient(
  range: DateRange,
  currency: string,
): Promise<ClientRevenueRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];
  const { fromDay, toDay } = rangeCacheKey(range);
  return _cachedGetRevenueByClient(user.id, fromDay, toDay, currency);
}

// ---------------------------------------------------------------------------
// Internal: fetch all invoices matching date + status + search (no pagination)
// Sort + pagination applied in-memory after cache hit.
// ---------------------------------------------------------------------------
const _cachedFetchFilteredInvoices = unstable_cache(
  async (
    userId: string,
    fromDay: string,
    toDay: string,
    statusKey: string,
    search: string
  ): Promise<FinanceInvoiceRow[]> => {
    const { supabase } = await getServerContext();
    const { from, to } = rangeFromCacheKey(fromDay, toDay);
    const now = new Date().toISOString();

    let query = supabase
      .from("documents")
      .select(
        "*, clients:client_id(id, name), projects:project_id(id, title), line_items(quantity, unit_price, tax_rate)"
      )
      .eq("user_id", userId)
      .eq("type", "invoice")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at", { ascending: false });

    if (statusKey === "overdue") {
      query = query.in("status", ["sent", "viewed"]).lt("due_date", now);
    } else if (statusKey === "outstanding") {
      query = query.in("status", ["sent", "viewed"]);
    } else if (statusKey) {
      query = query.eq("status", statusKey);
    }

    if (search) {
      const { data: matchingClients } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", `%${search}%`);
      const clientIds = (matchingClients ?? []).map((c) => c.id);

      if (clientIds.length > 0) {
        query = query.or(
          `invoice_number.ilike.%${search}%,client_id.in.(${clientIds.join(",")})`
        );
      } else {
        query = query.ilike("invoice_number", `%${search}%`);
      }
    }

    const { data: docs, error } = await query;
    if (error) console.error("[finance-queries] fetch invoices error:", error.message);

    return (docs ?? []).map((row) => {
      const normalized = normalizeDocumentListRow(row);
      const items = (row.line_items ?? []) as LineItemLike[];
      const computedTotal = calculateInvoiceTotal(items, Number(row.discount_value ?? 0), coerceDiscountType(row.discount_type), {
        taxMode: row.tax_mode,
        taxRate: row.tax_rate,
      });
      return { ...normalized, computedTotal };
    });
  },
  ["finance-invoices"],
  { revalidate: 60, tags: ["finance"] }
);

export async function listFinanceInvoices(filters: InvoiceFilters): Promise<PaginatedInvoices> {
  const { user } = await getServerContext();
  if (!user) return { invoices: [], total: 0, pageCount: 0 };

  const key = rangeCacheKey(filters.dateRange);
  const all = await _cachedFetchFilteredInvoices(
    user.id,
    key.fromDay,
    key.toDay,
    filters.status ?? "",
    filters.search ?? ""
  );

  const sorted = sortInvoices(all, filters.sort);
  const total = sorted.length;
  const pageCount = Math.ceil(total / filters.pageSize);
  const start = (filters.page - 1) * filters.pageSize;
  const invoices = sorted.slice(start, start + filters.pageSize);

  return { invoices, total, pageCount };
}

// ---------------------------------------------------------------------------
// exportFinanceInvoices — all matching rows for CSV download (no page limit)
// ---------------------------------------------------------------------------
export async function exportFinanceInvoices(
  filters: Omit<InvoiceFilters, "page">
): Promise<FinanceInvoiceRow[]> {
  const { user } = await getServerContext();
  if (!user) return [];

  const key = rangeCacheKey(filters.dateRange);
  const all = await _cachedFetchFilteredInvoices(
    user.id,
    key.fromDay,
    key.toDay,
    filters.status ?? "",
    filters.search ?? ""
  );

  return sortInvoices(all, filters.sort);
}

// ---------------------------------------------------------------------------
// getAgingReport — overdue buckets for all unpaid invoices (ignores date filter)
// ---------------------------------------------------------------------------
const _cachedGetAgingReport = unstable_cache(
  async (userId: string, currency: string): Promise<AgingReport> => {
    const { supabase } = await getServerContext();
    const now = new Date();

    const { data: docs, error } = await supabase
      .from("documents")
      .select(
        "id, due_date, discount_value, discount_type, tax_mode, tax_rate, status, line_items(quantity, unit_price, tax_rate), payments!payments_document_id_fkey(amount), invoice_adjustments(amount, type)"
      )
      .eq("user_id", userId)
      .eq("type", "invoice")
      .eq("currency", currency)
      .in("status", ["sent", "viewed", "partially_paid"]);

    if (error) console.error("[finance-queries] aging report error:", error.message);

    const empty = (label: string): AgingBucket => ({ label, count: 0, total: 0 });

    const report = {
      current: empty("Current (not yet due)"),
      overdue1to30: empty("1–30 days overdue"),
      overdue31to60: empty("31–60 days overdue"),
      overdue60plus: empty("60+ days overdue"),
      grandTotal: 0,
    };

    for (const doc of docs ?? []) {
      const items = (doc.line_items ?? []) as LineItemLike[];
      const total = calculateInvoiceTotal(items, Number(doc.discount_value ?? 0), coerceDiscountType(doc.discount_type), {
        taxMode: doc.tax_mode,
        taxRate: doc.tax_rate,
      });
      const paid = ((doc.payments ?? []) as Array<{ amount: number }>).reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const writtenOff = ((doc.invoice_adjustments ?? []) as Array<{ amount: number; type: string }>)
        .filter((a) => a.type === "write_off")
        .reduce((sum, a) => sum + Number(a.amount), 0);
      // Only the balance still owed ages — a 90%-paid invoice is not a 100% risk.
      const amount = Math.round((total - paid - writtenOff) * 100) / 100;
      if (amount <= 0) continue;

      report.grandTotal += amount;

      if (!doc.due_date) {
        report.current.count++;
        report.current.total += amount;
        continue;
      }

      const daysOverdue = Math.floor(
        (now.getTime() - new Date(doc.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysOverdue <= 0) {
        report.current.count++;
        report.current.total += amount;
      } else if (daysOverdue <= 30) {
        report.overdue1to30.count++;
        report.overdue1to30.total += amount;
      } else if (daysOverdue <= 60) {
        report.overdue31to60.count++;
        report.overdue31to60.total += amount;
      } else {
        report.overdue60plus.count++;
        report.overdue60plus.total += amount;
      }
    }

    return report;
  },
  ["finance-aging"],
  { revalidate: 60, tags: ["finance"] }
);

export async function getAgingReport(currency: string): Promise<AgingReport> {
  const { user } = await getServerContext();
  if (!user)
    return {
      current: { label: "Current (not yet due)", count: 0, total: 0 },
      overdue1to30: { label: "1–30 days overdue", count: 0, total: 0 },
      overdue31to60: { label: "31–60 days overdue", count: 0, total: 0 },
      overdue60plus: { label: "60+ days overdue", count: 0, total: 0 },
      grandTotal: 0,
    };
  return _cachedGetAgingReport(user.id, currency);
}
