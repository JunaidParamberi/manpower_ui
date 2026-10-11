import {
  calculateInvoiceBalance,
  getInvoicePaymentStatus,
} from "@/lib/documents/payment-balance";
import { canTransition } from "@/lib/documents/status-transitions";
import type { DocumentStatus, DocumentType } from "@/types";

export type PaymentProvider = "manual" | "mock" | "stripe";

export type PaymentApplicationInput = {
  documentType: DocumentType;
  documentStatus: DocumentStatus;
  invoiceTotal: number;
  existingPayments: number[];
  existingWriteOffs: number[];
  amount: number;
  remainingAction?: "keep_due" | "write_off";
};

export type PaymentApplicationPlan =
  | {
      ok: true;
      amount: number;
      writeOffAmount: number;
      nextStatus: Extract<DocumentStatus, "paid" | "partially_paid" | "written_off" | "sent">;
    }
  | { ok: false; error: string };

function toMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function planPaymentApplication(
  input: PaymentApplicationInput,
): PaymentApplicationPlan {
  if (input.documentType !== "invoice") {
    return { ok: false, error: "Payments can only be recorded on invoices." };
  }

  const balance = calculateInvoiceBalance({
    invoiceTotal: input.invoiceTotal,
    payments: input.existingPayments,
    writeOffs: input.existingWriteOffs,
  });

  if (balance.balanceDue <= 0) {
    return { ok: false, error: "This invoice has no remaining balance." };
  }

  const amount = toMoney(input.amount);
  if (amount <= 0) {
    return { ok: false, error: "Payment amount must be positive." };
  }
  if (amount > balance.balanceDue) {
    return { ok: false, error: "Payment amount cannot exceed the remaining balance." };
  }

  const remaining = toMoney(balance.balanceDue - amount);
  const writeOffAmount =
    input.remainingAction === "write_off" && remaining > 0 ? remaining : 0;

  const nextStatus = getInvoicePaymentStatus({
    invoiceTotal: balance.invoiceTotal,
    totalPaid: toMoney(balance.totalPaid + amount),
    totalWrittenOff: toMoney(balance.totalWrittenOff + writeOffAmount),
  });

  // Status machine guard: e.g. blocks paying a draft or voided invoice.
  if (!canTransition("invoice", input.documentStatus, nextStatus)) {
    return {
      ok: false,
      error: `Cannot record a payment on a ${input.documentStatus.replace(/_/g, " ")} invoice. Send it first.`,
    };
  }

  return { ok: true, amount, writeOffAmount, nextStatus };
}
