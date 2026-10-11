"use client";

import { useState, useTransition } from "react";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/shared/number-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { recordInvoicePayment } from "@/lib/documents/invoice-mutations";
import type { PaymentMethod } from "@/types";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
  cheque: "Cheque",
  card: "Card",
  other: "Other",
};

interface MarkPaidButtonProps {
  documentId: string;
  invoiceTotal: number;
  totalPaid: number;
  totalWrittenOff: number;
  remainingBalance: number;
  currency: string;
  homeCurrency: string;
  isPaid?: boolean;
}

export function MarkPaidButton({
  documentId,
  invoiceTotal,
  totalPaid,
  totalWrittenOff,
  remainingBalance,
  currency,
  homeCurrency,
  isPaid: initialIsPaid = false,
}: MarkPaidButtonProps) {
  const router = useRouter();
  const [paid, setPaid] = useState(initialIsPaid);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [amount, setAmount] = useState(() => remainingBalance.toFixed(2));
  const [fxRate, setFxRate] = useState("");
  const [remainingAction, setRemainingAction] = useState<"keep_due" | "write_off">("keep_due");
  const [writeOffReason, setWriteOffReason] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [, startTransition] = useTransition();
  const showFxRateInput = currency !== homeCurrency;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });
  const amountNumber = Number(amount);
  const remainingAfterPayment = Math.max(0, remainingBalance - (Number.isFinite(amountNumber) ? amountNumber : 0));
  const isPartialPayment = remainingAfterPayment > 0.009;

  if (paid) {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-green-600 text-green-600 dark:border-green-400 dark:text-green-400"
      >
        <CheckCircle className="h-3.5 w-3.5" />
        Paid
      </Badge>
    );
  }

  const handleConfirm = () => {
    setLoading(true);
    setError("");
    startTransition(async () => {
      const result = await recordInvoicePayment(documentId, {
        amount: amountNumber,
        method,
        fxRate: fxRate ? Number(fxRate) : undefined,
        remainingAction: isPartialPayment ? remainingAction : undefined,
        writeOffReason:
          isPartialPayment && remainingAction === "write_off"
            ? writeOffReason.trim()
            : undefined,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      if (result.ok) {
        setPaid(result.status === "paid" || result.status === "written_off");
        setOpen(false);
        toast.success(
          result.status === "partially_paid"
            ? "Partial payment recorded"
            : "Payment recorded",
        );
        if (result.warning) {
          toast.warning(result.warning);
        }
        router.refresh();
      } else {
        setError(result.error ?? "Failed to mark as paid.");
        toast.error(result.error ?? "Failed to mark as paid.");
      }
      setLoading(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" aria-label="Record payment">
            <CheckCircle />
            <span className="hidden sm:inline">Record payment</span>
          </Button>
        }
      />

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>
              Record the amount received. If it is less than the balance, choose whether to keep the rest due or write it off.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-1">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-3 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Invoice total</span>
                <span className="font-medium">{formatter.format(invoiceTotal)}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Already paid</span>
                <span className="font-medium">{formatter.format(totalPaid)}</span>
              </div>
              {totalWrittenOff > 0 ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">Written off</span>
                  <span className="font-medium">{formatter.format(totalWrittenOff)}</span>
                </div>
              ) : null}
              <div className="flex flex-col gap-0.5">
                <span className="text-muted-foreground">Balance due</span>
                <span className="font-semibold">{formatter.format(remainingBalance)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payment-amount">Amount received</Label>
              <NumberInput
                id="payment-amount"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {showFxRateInput && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="payment-fxrate">
                  FX rate (1 {currency} = ? {homeCurrency})
                </Label>
                <NumberInput
                  id="payment-fxrate"
                  min="0.000001"
                  step="0.0001"
                  placeholder="e.g. 4.6121"
                  value={fxRate}
                  onChange={(e) => setFxRate(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payment-method">Payment method</Label>
              <Select
                value={method}
                onValueChange={(v) => setMethod(v as PaymentMethod)}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue>{PAYMENT_METHOD_LABELS[method]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(PAYMENT_METHOD_LABELS) as [
                      PaymentMethod,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isPartialPayment ? (
              <div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
                <div className="text-xs text-muted-foreground">
                  Remaining after this payment:{" "}
                  <span className="font-medium text-foreground">
                    {formatter.format(remainingAfterPayment)}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="remaining-action">What happens to the remaining balance?</Label>
                  <Select
                    value={remainingAction}
                    onValueChange={(v) => setRemainingAction(v as "keep_due" | "write_off")}
                  >
                    <SelectTrigger id="remaining-action">
                      <SelectValue>
                        {remainingAction === "write_off"
                          ? "Write off remaining balance"
                          : "Keep balance due"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep_due">Keep balance due</SelectItem>
                      <SelectItem value="write_off">Write off remaining balance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {remainingAction === "write_off" ? (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="write-off-reason">Write-off reason</Label>
                    <Input
                      id="write-off-reason"
                      placeholder="Reason for writing off the balance"
                      value={writeOffReason}
                      onChange={(e) => setWriteOffReason(e.target.value)}
                      maxLength={500}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payment-reference">
                Reference{" "}
                <span className="text-muted-foreground font-normal">
                  (cheque no., transfer ID, etc.)
                </span>
              </Label>
              <Input
                id="payment-reference"
                placeholder="Optional"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                maxLength={200}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="payment-notes">
                Notes{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="payment-notes"
                placeholder="Optional"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving…
                </>
              ) : (
                "Confirm payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}
