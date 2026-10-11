"use client";

import { NewDocumentButton } from "@/components/features/documents/workspace/new-document-button";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO, isPast } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Filter,
  MoreHorizontal,
  Send,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { FinanceInvoiceRow, InvoiceFilters, SortKey } from "@/lib/finance/types";
import { exportFinanceInvoices } from "@/lib/finance/finance-queries";

type Props = {
  invoices: FinanceInvoiceRow[];
  total: number;
  pageCount: number;
  currentPage: number;
  currentSort: SortKey;
  currency: string;
  filters: Omit<InvoiceFilters, "page">;
};

const STATUS_PILLS = [
  { label: "All", value: "" },
  { label: "Outstanding", value: "outstanding" },
  { label: "Paid", value: "paid" },
] as const;

const FILTER_MENU_ITEMS = [
  { label: "Overdue", value: "overdue" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
] as const;

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildCsv(invoices: FinanceInvoiceRow[]): string {
  const headers = ["Invoice #", "Client", "Issue Date", "Due Date", "Status", "Amount"];
  const rows = invoices.map((inv) => [
    inv.invoice_number ?? inv.title,
    inv.client?.name ?? "",
    format(parseISO(inv.created_at), "yyyy-MM-dd"),
    inv.due_date ? format(parseISO(inv.due_date), "yyyy-MM-dd") : "",
    inv.status,
    inv.computedTotal.toFixed(2),
  ]);
  return [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function clientMonogram(name: string | null | undefined): string {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CL";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function avatarTone(name: string | null | undefined): string {
  const tones = [
    "bg-[var(--chart-1)] text-primary-foreground",
    "bg-[var(--chart-4)] text-primary-foreground",
    "bg-[var(--chart-5)] text-primary-foreground",
    "bg-[var(--info)] text-primary-foreground",
    "bg-[var(--warning)] text-primary-foreground",
    "bg-[var(--danger)] text-primary-foreground",
  ];
  const key = name ?? "client";
  const index = Array.from(key).reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length;
  return tones[index];
}

function statusDisplay(status: FinanceInvoiceRow["status"], overdue: boolean) {
  if (overdue) {
    return {
      label: "Overdue",
      className: "bg-[var(--danger-soft)] text-[var(--danger)]",
      dotClassName: "bg-[var(--danger)]",
    };
  }

  if (status === "paid") {
    return {
      label: "Paid",
      className: "bg-[var(--success-soft)] text-[var(--success)]",
      dotClassName: "bg-[var(--success)]",
    };
  }

  if (status === "partially_paid") {
    return {
      label: "Partial",
      className: "bg-[var(--warning-soft)] text-[var(--warning)]",
      dotClassName: "bg-[var(--warning)]",
    };
  }

  if (status === "sent" || status === "viewed") {
    return {
      label: status === "viewed" ? "Viewed" : "Sent",
      className: "bg-[var(--info-soft)] text-[var(--info)]",
      dotClassName: "bg-[var(--info)]",
    };
  }

  return {
    label: status === "draft" ? "Draft" : status.replaceAll("_", " "),
    className: "bg-muted text-muted-foreground",
    dotClassName: "bg-muted-foreground",
  };
}

function downloadBlob(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type SortableHeaderProps = {
  label: string;
  field: string;
  currentSort: SortKey;
  className?: string;
};

function SortableHeader({ label, field, currentSort, className }: SortableHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const underscoreIdx = currentSort.lastIndexOf("_");
  const currentField = currentSort.slice(0, underscoreIdx);
  const currentDir = currentSort.slice(underscoreIdx + 1);

  const isActive = currentField === field;
  const nextDir = isActive && currentDir === "asc" ? "desc" : "asc";
  const nextSort: SortKey = `${field}_${nextDir}` as SortKey;

  function handleSort() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", nextSort);
    params.delete("page");
    router.push(`/finance?${params.toString()}`);
  }

  return (
    <TableHead className={cn("cursor-pointer select-none", className)} onClick={handleSort}>
      <span className="flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 text-muted-foreground/40" />
        )}
      </span>
    </TableHead>
  );
}

function Pagination({
  currentPage,
  pageCount,
}: {
  currentPage: number;
  pageCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (pageCount <= 1) return null;

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/finance?${params.toString()}`);
  }

  const pages: (number | "…")[] = [];
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("…");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(pageCount - 1, currentPage + 1);
      i++
    )
      pages.push(i);
    if (currentPage < pageCount - 2) pages.push("…");
    pages.push(pageCount);
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        disabled={currentPage <= 1}
        onClick={() => goTo(currentPage - 1)}
      >
        ← Prev
      </Button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "outline"}
            size="sm"
            className="h-7 w-7 p-0 text-xs"
            onClick={() => goTo(p)}
          >
            {p}
          </Button>
        )
      )}
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        disabled={currentPage >= pageCount}
        onClick={() => goTo(currentPage + 1)}
      >
        Next →
      </Button>
    </div>
  );
}

export function FinanceInvoiceTable({
  invoices,
  total,
  pageCount,
  currentPage,
  currentSort,
  currency,
  filters,
}: Props) {
  const [exporting, setExporting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(`/finance?${params.toString()}`);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const all = await exportFinanceInvoices(filters);
      const csv = buildCsv(all);
      downloadBlob(csv, `invoices-${format(new Date(), "yyyy-MM-dd")}.csv`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 sm:px-5">
        <span className="text-sm font-semibold text-foreground">
          All invoices
        </span>
        <div className="flex items-center gap-2">
          {STATUS_PILLS.map((pill) => (
            <button
              key={pill.label}
              type="button"
              onClick={() => handleStatus(pill.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                (filters.status ?? "") === pill.value
                  ? "bg-muted text-foreground shadow-[var(--shadow-xs)]"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              {pill.label}
            </button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="More invoice filters"
                >
                  <Filter />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {FILTER_MENU_ITEMS.map((item) => (
                  <DropdownMenuItem key={item.value} onClick={() => handleStatus(item.value)}>
                    {item.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport} disabled={exporting || invoices.length === 0}>
                  <Download />
                  {exporting ? "Exporting..." : "Export CSV"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-b-lg py-14 text-center">
          <p className="text-sm font-medium text-foreground">No invoices in this period</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create an invoice to start tracking revenue
          </p>
          <div className="mt-4">
            <NewDocumentButton contextType="invoice" variant="outline" />
          </div>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/60 hover:bg-transparent">
                <SortableHeader
                  label="Invoice"
                  field="date"
                  currentSort={currentSort}
                  className="w-[140px] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:px-5"
                />
                <SortableHeader
                  label="Client"
                  field="client"
                  currentSort={currentSort}
                  className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                />
                <SortableHeader
                  label="Issued"
                  field="date"
                  currentSort={currentSort}
                  className="hidden px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:table-cell"
                />
                <SortableHeader
                  label="Due"
                  field="date"
                  currentSort={currentSort}
                  className="hidden px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground md:table-cell"
                />
                <SortableHeader
                  label="Amount"
                  field="amount"
                  currentSort={currentSort}
                  className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                />
                <SortableHeader
                  label="Status"
                  field="status"
                  currentSort={currentSort}
                  className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                />
                <TableHead className="w-20 px-4 py-2.5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const isOverdue =
                  invoice.status !== "paid" &&
                  invoice.due_date &&
                  isPast(parseISO(invoice.due_date));

                return (
                  <TableRow
                    key={invoice.id}
                    data-interactive="true"
                    className={cn(
                      "group border-border/50 transition-colors hover:bg-muted/30",
                      isOverdue && "bg-[var(--danger-soft)]/40",
                    )}
                  >
                    <TableCell className="px-4 py-3 sm:px-5">
                      <span className="text-sm font-semibold text-foreground">
                        {invoice.invoice_number ?? invoice.title}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar size="sm" className={avatarTone(invoice.client?.name)}>
                          <AvatarFallback className={cn("font-heading text-[10px]", avatarTone(invoice.client?.name))}>
                            {clientMonogram(invoice.client?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 truncate text-sm font-medium text-muted-foreground">
                          {invoice.client?.name ?? "No client"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 md:table-cell">
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          isOverdue ? "font-medium text-[var(--danger)]" : "text-muted-foreground"
                        )}
                      >
                        {invoice.created_at ? (
                          format(parseISO(invoice.created_at), "MMM dd")
                        ) : (
                          <span className="text-border">—</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="hidden px-4 py-3 md:table-cell">
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          isOverdue ? "font-medium text-[var(--danger)]" : "text-muted-foreground"
                        )}
                      >
                        {invoice.due_date ? (
                          format(parseISO(invoice.due_date), "MMM dd")
                        ) : (
                          <span className="text-border">—</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "font-mono text-sm tabular-nums",
                          invoice.computedTotal === 0
                            ? "text-muted-foreground"
                            : "font-semibold text-foreground"
                        )}
                      >
                        {formatMoney(invoice.computedTotal, currency)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {(() => {
                        const status = statusDisplay(invoice.status, Boolean(isOverdue));
                        return (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium",
                              status.className,
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full", status.dotClassName)} aria-hidden />
                            {status.label}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/documents/${invoice.id}`}
                          aria-label={`Review and send ${invoice.invoice_number ?? invoice.title}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon-sm" }),
                            "opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100",
                          )}
                        >
                          <Send />
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${invoice.invoice_number ?? invoice.title}`}
                                className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                              >
                                <MoreHorizontal />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem render={<Link href={`/documents/${invoice.id}`} />}>
                                Open
                              </DropdownMenuItem>
                              <DropdownMenuItem render={<Link href={`/documents/${invoice.id}?edit=1`} />}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={handleExport}>
                                Export CSV
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-border/40 px-6 py-3">
            <span className="text-xs text-muted-foreground">
              Showing{" "}
              {Math.min((currentPage - 1) * 20 + 1, total)}–
              {Math.min(currentPage * 20, total)} of {total}
            </span>
            <Pagination currentPage={currentPage} pageCount={pageCount} />
          </div>
        </>
      )}
    </div>
  );
}
