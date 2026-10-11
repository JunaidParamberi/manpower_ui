export type BillingInvoiceStatus = "paid" | "pending" | "void" | "refunded";

export interface BillingInvoice {
  id: string;
  status: BillingInvoiceStatus;
  totalFormatted: string;
  totalCents: number;
  currency: string;
  invoiceUrl: string | null;
  createdAt: string;
  isTestMode: boolean;
}

interface LsInvoiceRow {
  id: string;
  attributes: {
    status: BillingInvoiceStatus;
    total_formatted: string;
    total: number;
    currency: string;
    urls: { invoice_url: string };
    created_at: string;
    test_mode: boolean;
  };
}

export function transformLsInvoice(row: LsInvoiceRow): BillingInvoice {
  return {
    id: row.id,
    status: row.attributes.status,
    totalFormatted: row.attributes.total_formatted,
    totalCents: row.attributes.total,
    currency: row.attributes.currency,
    invoiceUrl: row.attributes.urls.invoice_url || null,
    createdAt: row.attributes.created_at,
    isTestMode: row.attributes.test_mode,
  };
}
