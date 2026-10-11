"use client";

import { NewDocumentButton } from "@/components/features/documents/workspace/new-document-button";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { FinanceInvoiceRow, InvoiceFilters } from "@/lib/finance/types";
import { exportFinanceInvoices } from "@/lib/finance/finance-queries";
import {
  currentMonthRange,
  formatDateParam,
  lastNMonthsRange,
  yearToDateRange,
} from "@/lib/finance/date-utils";
import { cn } from "@/lib/utils";

type FinanceHeaderActionsProps = {
  filters: Omit<InvoiceFilters, "page">;
};

const PRESETS = [
  { label: "This month", getRange: currentMonthRange },
  { label: "Last 3M", getRange: () => lastNMonthsRange(3) },
  { label: "This year", getRange: yearToDateRange },
] as const;

function buildCsv(invoices: FinanceInvoiceRow[]): string {
  const headers = ["Invoice #", "Client", "Issue Date", "Due Date", "Status", "Amount"];
  const rows = invoices.map((invoice) => [
    invoice.invoice_number ?? invoice.title,
    invoice.client?.name ?? "",
    format(new Date(invoice.created_at), "yyyy-MM-dd"),
    invoice.due_date ? format(new Date(invoice.due_date), "yyyy-MM-dd") : "",
    invoice.status,
    invoice.computedTotal.toFixed(2),
  ]);
  return [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `finance-${format(new Date(), "yyyy-MM-dd")}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function FinanceHeaderActions({ filters }: FinanceHeaderActionsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [exporting, setExporting] = useState(false);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  function applyRange(from: Date, to: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", formatDateParam(from));
    params.set("to", formatDateParam(to));
    params.delete("page");
    router.push(`/finance?${params.toString()}`);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const invoices = await exportFinanceInvoices(filters);
      downloadCsv(buildCsv(invoices));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5">
        {PRESETS.map((preset) => {
          const range = preset.getRange();
          const active =
            (!fromParam && !toParam && preset.label === "This month") ||
            (fromParam === formatDateParam(range.from) &&
              toParam === formatDateParam(range.to));

          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyRange(range.from, range.to)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          <Download data-icon="inline-start" />
          {exporting ? "Exporting..." : "Export"}
        </Button>
        <NewDocumentButton contextType="invoice" size="default" />
      </div>
    </div>
  );
}
