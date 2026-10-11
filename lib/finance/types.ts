import type { DocumentStatus } from "@/types";
import type { DocumentListRow } from "@/types";
import type { CurrencyBreakdown } from "@/lib/finance/summary-calc";

export type FinancialSummary = {
  /** Currency the headline numbers are in — see AggregatedSummary.primaryCurrency. */
  primaryCurrency: string;
  totalRevenue: number;
  outstanding: number;
  overdue: number;
  avgPayDays: number | null;
  revenueChangePct: number | null;
  overdueCount: number;
  outstandingCount: number;
  baseCurrency: string;
  byCurrency: CurrencyBreakdown[];
};

export type MonthlyRevenuePoint = {
  month: string;
  monthKey: string;
  revenue: number;
  isCurrent: boolean;
};

/** Ranges the dashboard revenue card can show. */
export type RevenueRangeId = "6m" | "1y" | "all";

export type ClientRevenueRow = {
  clientId: string;
  clientName: string;
  total: number;
  percentage: number;
};

export type DateRange = {
  from: Date;
  to: Date;
};

export type SortKey =
  | "date_asc"
  | "date_desc"
  | "amount_asc"
  | "amount_desc"
  | "client_asc"
  | "client_desc"
  | "status_asc"
  | "status_desc";

export type StatusFilter = DocumentStatus | "overdue" | "outstanding";

export type InvoiceFilters = {
  dateRange: DateRange;
  page: number;
  pageSize: number;
  sort: SortKey;
  search?: string;
  status?: StatusFilter;
};

export type FinanceInvoiceRow = DocumentListRow & { computedTotal: number };

export type PaginatedInvoices = {
  invoices: FinanceInvoiceRow[];
  total: number;
  pageCount: number;
};

export type AgingBucket = {
  label: string;
  count: number;
  total: number;
};

export type AgingReport = {
  current: AgingBucket;
  overdue1to30: AgingBucket;
  overdue31to60: AgingBucket;
  overdue60plus: AgingBucket;
  grandTotal: number;
};
