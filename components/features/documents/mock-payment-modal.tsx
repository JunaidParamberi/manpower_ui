"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PUBLIC_DOC_TITLE_CLASS } from "@/components/shared/title-classes";

interface MockPaymentFormProps {
  payToken: string;
  invoiceId: string;
  total: number;
  currency: string;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  }
  if (digits.length === 2) {
    return `${digits} / `;
  }
  return digits;
}

export function MockPaymentForm({
  payToken,
  total,
  currency,
}: MockPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(total);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/invoices/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pay_token: payToken }),
      });

      if (res.status === 409) {
        setSuccess(true);
        return;
      }

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Payment failed. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="size-7 text-emerald-600" />
        </div>
        <div>
          <p className={PUBLIC_DOC_TITLE_CLASS}>
            Payment received!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your invoice has been marked as paid. Thank you!
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Payment details
        </h2>
        <span className="text-xs text-muted-foreground">
          Powered by{" "}
          <span className="font-medium text-foreground/60">Stripe</span>
        </span>
      </div>

      {/* Card number */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-number" className="text-xs">
          Card number
        </Label>
        <Input
          id="card-number"
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="1234 1234 1234 1234"
          value={cardNumber}
          onInput={(e) => {
            const target = e.currentTarget;
            setCardNumber(formatCardNumber(target.value));
          }}
          onChange={() => {
            /* controlled via onInput */
          }}
          maxLength={19}
          required
        />
      </div>

      {/* Expiry + CVC row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expiry" className="text-xs">
            Expiry
          </Label>
          <Input
            id="expiry"
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM / YY"
            value={expiry}
            onInput={(e) => {
              const target = e.currentTarget;
              setExpiry(formatExpiry(target.value));
            }}
            onChange={() => {
              /* controlled via onInput */
            }}
            maxLength={7}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cvc" className="text-xs">
            CVC
          </Label>
          <Input
            id="cvc"
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="CVC"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
            maxLength={4}
            required
          />
        </div>
      </div>

      {/* Cardholder name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cardholder-name" className="text-xs">
          Cardholder name
        </Label>
        <Input
          id="cardholder-name"
          type="text"
          autoComplete="cc-name"
          placeholder="Full name on card"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
        />
      </div>

      {/* Error message */}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {/* Submit */}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Processing…" : `Pay ${formattedTotal}`}
      </Button>
    </form>
  );
}
