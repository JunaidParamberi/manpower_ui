import {
  computeDocumentTotals,
  type DocumentTaxInput,
} from "@/lib/documents/compute-document-totals";
import type { DocumentStatus } from "@/types";

type CalculateInvoiceBalanceInput = {
  invoiceTotal: number;
  payments: number[];
  writeOffs: number[];
};

export type InvoiceBalance = {
  invoiceTotal: number;
  totalPaid: number;
  totalWrittenOff: number;
  balanceDue: number;
};

function toMoney(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100);
}

export function calculateInvoiceBalance({
  invoiceTotal,
  payments,
  writeOffs,
}: CalculateInvoiceBalanceInput): InvoiceBalance {
  const totalPaid = toMoney(payments.reduce((sum, amount) => sum + amount, 0));
  const totalWrittenOff = toMoney(
    writeOffs.reduce((sum, amount) => sum + amount, 0),
  );
  const balanceDue = toMoney(invoiceTotal - totalPaid - totalWrittenOff);

  return {
    invoiceTotal: toMoney(invoiceTotal),
    totalPaid,
    totalWrittenOff,
    balanceDue,
  };
}

export function calculateInvoiceTotal(
  lineItems: Array<{ quantity: number | string; unit_price: number | string; tax_rate?: number | string | null }>,
  discountValue: number,
  discountType: "percent" | "flat",
  docTax?: DocumentTaxInput | null,
): number {
  return computeDocumentTotals(lineItems, discountValue, discountType, docTax).total;
}

export function getInvoicePaymentStatus({
  invoiceTotal,
  totalPaid,
  totalWrittenOff,
}: {
  invoiceTotal: number;
  totalPaid: number;
  totalWrittenOff: number;
}): Extract<DocumentStatus, "paid" | "partially_paid" | "written_off" | "sent"> {
  const balanceDue = toMoney(invoiceTotal - totalPaid - totalWrittenOff);

  if (balanceDue <= 0 && totalWrittenOff > 0) return "written_off";
  if (balanceDue <= 0) return "paid";
  if (totalPaid > 0) return "partially_paid";
  return "sent";
}
