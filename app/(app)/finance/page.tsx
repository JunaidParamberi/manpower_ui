import type { Metadata } from "next";
import { Suspense } from "react";
import { format } from "date-fns";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinanceHeaderActions } from "@/components/features/finance/finance-header-actions";
import { SkeletonCountRecorder } from "@/hooks/use-skeleton-count";
import { FinanceSummaryCards } from "@/components/features/finance/finance-summary-cards";
import { RevenueTrendChart } from "@/components/features/finance/revenue-area-chart";
import { RevenueByClientPanel } from "@/components/features/finance/revenue-by-client-panel";
import { FinanceInvoiceTable } from "@/components/features/finance/finance-invoice-table";
import {
  getFinancialSummary,
  getMonthlyRevenue,
  getRevenueByClient,
  listFinanceInvoices,
} from "@/lib/finance/finance-queries";
import { parseDateRangeParams } from "@/lib/finance/date-utils";
import {
  parsePageParam,
  parseSortParam,
  parseSearchParam,
  parseStatusParam,
} from "@/lib/finance/filter-utils";
import type { InvoiceFilters } from "@/lib/finance/types";
import { formatCurrency } from "@/lib/utils/format";
import { PAGE_TITLE_CLASS } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Finance" };

type SearchParams = Promise<{
  from?: string;
  to?: string;
  page?: string;
  sort?: string;
  search?: string;
  status?: string;
}>;

function formatDateRangeLabel(from: Date, to: Date): string {
  const sameYear = from.getFullYear() === to.getFullYear();
  const fromFormat = sameYear ? "MMM d" : "MMM d, yyyy";
  return `${format(from, fromFormat)} — ${format(to, "MMM d, yyyy")}`;
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { from, to, page, sort, search, status } = await searchParams;
  const range = parseDateRangeParams(from, to);

  const filters: InvoiceFilters = {
    dateRange: range,
    page: parsePageParam(page),
    pageSize: 20,
    sort: parseSortParam(sort),
    search: parseSearchParam(search),
    status: parseStatusParam(status),
  };

  // The summary decides which currency the page is expressed in: the profile
  // default when it holds money, otherwise whichever currency actually does.
  const summary = await getFinancialSummary(range);
  const currency = summary.primaryCurrency;

  const [monthlyRevenue, clientRevenue, paginatedInvoices] = await Promise.all([
    getMonthlyRevenue(range, currency),
    getRevenueByClient(range, currency),
    listFinanceInvoices(filters),
  ]);

  const dateLabel = formatDateRangeLabel(range.from, range.to);
  const invoiceCount = paginatedInvoices.total;

  return (
    <>
      <SkeletonCountRecorder
        id="finance:invoices"
        count={paginatedInvoices.invoices.length}
      />
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Money / Finance
          </p>
          <h1 className={cn(PAGE_TITLE_CLASS, "mt-1")}>Finance</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {dateLabel} · {invoiceCount} invoice{invoiceCount === 1 ? "" : "s"} issued ·{" "}
            {formatCurrency(summary.totalRevenue, currency)} total
          </p>
        </div>
        <Suspense fallback={null}>
          <FinanceHeaderActions
            filters={{
              dateRange: filters.dateRange,
              pageSize: filters.pageSize,
              sort: filters.sort,
              search: filters.search,
              status: filters.status,
            }}
          />
        </Suspense>
      </header>

      <FinanceSummaryCards summary={summary} />

      <div className="grid gap-4 @5xl/shell:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <CardTitle className="text-sm font-medium">Revenue trend</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Paid invoices only · {currency}
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <RevenueTrendChart data={monthlyRevenue} currency={currency} />
          </CardContent>
        </Card>

        <RevenueByClientPanel
          rows={clientRevenue}
          currency={currency}
          dateLabel={dateLabel}
        />
      </div>

      <Card>
        <Suspense fallback={null}>
          <FinanceInvoiceTable
            invoices={paginatedInvoices.invoices}
            total={paginatedInvoices.total}
            pageCount={paginatedInvoices.pageCount}
            currentPage={filters.page}
            currentSort={filters.sort}
            currency={currency}
            filters={{
              dateRange: filters.dateRange,
              pageSize: filters.pageSize,
              sort: filters.sort,
              search: filters.search,
              status: filters.status,
            }}
          />
        </Suspense>
      </Card>
    </>
  );
}
