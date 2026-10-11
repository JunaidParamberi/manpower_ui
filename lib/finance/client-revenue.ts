import type { ClientRevenueRow } from "./types";
import { calculateInvoiceTotal } from "@/lib/documents/payment-balance";

type LineItemLike = {
  quantity: number | string;
  unit_price: number | string;
  tax_rate?: number | string | null;
};

export type ClientRevenueSourceRow = {
  client_id: string | null;
  clients: { name: string | null } | Array<{ name: string | null }> | null;
  /**
   * Money actually received. Preferred over the line-item columns: revenue is
   * sourced from `payments` so partial payments and write-offs are respected.
   * The line-item shape stays supported for callers holding whole invoices.
   */
  amount?: number | null;
  discount_type?: string | null;
  discount_value?: number | null;
  tax_mode?: string | null;
  tax_rate?: number | string | null;
  line_items?: LineItemLike[] | null;
};

function coerceDiscountType(value: string | null | undefined): "percent" | "flat" {
  return value === "flat" ? "flat" : "percent";
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercentage(value: number): number {
  return Math.round(value * 100) / 100;
}

function invoiceTotal(row: ClientRevenueSourceRow): number {
  if (row.amount !== undefined && row.amount !== null) return Number(row.amount);
  const items = row.line_items ?? [];
  return calculateInvoiceTotal(items, Number(row.discount_value ?? 0), coerceDiscountType(row.discount_type), {
    taxMode: row.tax_mode,
    taxRate: row.tax_rate,
  });
}

function clientName(row: ClientRevenueSourceRow): string {
  const embed = Array.isArray(row.clients) ? row.clients[0] : row.clients;
  return embed?.name ?? "Unknown client";
}

export function buildClientRevenueRows(
  invoices: ClientRevenueSourceRow[],
): ClientRevenueRow[] {
  const byClient = new Map<string, { clientName: string; total: number }>();

  for (const invoice of invoices) {
    if (!invoice.client_id) continue;
    const total = invoiceTotal(invoice);
    if (total <= 0) continue;

    const existing = byClient.get(invoice.client_id);
    byClient.set(invoice.client_id, {
      clientName: clientName(invoice),
      total: (existing?.total ?? 0) + total,
    });
  }

  const sorted = Array.from(byClient.entries())
    .map(([clientId, row]) => ({
      clientId,
      clientName: row.clientName,
      total: roundCurrency(row.total),
    }))
    .sort((a, b) => b.total - a.total);

  const grandTotal = sorted.reduce((sum, row) => sum + row.total, 0);
  if (grandTotal <= 0) return [];

  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const rows = [...top];

  if (rest.length > 0) {
    rows.push({
      clientId: "others",
      clientName: "Others",
      total: roundCurrency(rest.reduce((sum, row) => sum + row.total, 0)),
    });
  }

  return rows.map((row) => ({
    ...row,
    percentage: roundPercentage((row.total / grandTotal) * 100),
  }));
}
