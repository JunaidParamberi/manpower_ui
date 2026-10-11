import type { RecurringInvoiceFormInput } from "@/lib/validations/recurring-invoice";
import type { InvoiceDocumentRow } from "@/types";

export function invoiceToRecurringPrefill(
  invoice: InvoiceDocumentRow,
): RecurringInvoiceFormInput {
  const today = new Date().toISOString().slice(0, 10);
  return {
    client_id: invoice.client_id ?? "",
    project_id: invoice.project_id,
    title: invoice.title,
    interval: "monthly",
    interval_count: 1,
    start_date: today,
    end_date: null,
    occurrences_limit: null,
    auto_send: false,
    net_days: 7,
    currency: invoice.currency,
    tax_mode: invoice.tax_mode,
    tax_rate: invoice.tax_rate,
    discount_type: invoice.discount_type,
    discount_value: invoice.discount_value,
    notes_footer: invoice.notes_footer,
    payment_terms: invoice.payment_terms,
    line_items: invoice.line_items.map((item) => ({
      description: item.description,
      notes: item.notes,
      quantity: item.quantity,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      hsn_sac_code: item.hsn_sac_code,
    })),
  };
}
