"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReceiptIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NumberInput } from "@/components/shared/number-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTaxDefaults } from "@/lib/profile/actions";
import { TAX_MODE_LABELS, type TaxMode } from "@/lib/documents/tax/compute-tax";

type Props = {
  defaultMode: TaxMode;
  defaultRate: number;
};

const TAX_MODE_OPTIONS = (Object.entries(TAX_MODE_LABELS) as [TaxMode, string][]);

export function TaxDefaultsForm({ defaultMode, defaultRate }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [mode, setMode] = useState<TaxMode>(defaultMode);
  const [rate, setRate] = useState(String(defaultRate));

  const rateDisabled = mode === "none";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateTaxDefaults({
        tax_mode: mode,
        tax_rate: rateDisabled ? 0 : Number(rate),
      });
      if (!result.ok) {
        setServerError(result.error ?? "Failed to save tax settings.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ReceiptIcon className="size-4 text-muted-foreground" aria-hidden />
            <CardTitle>Tax defaults</CardTitle>
          </div>
          <CardDescription>
            Applied to new invoices and quotes. Overridable per document.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tax_mode">Tax type</Label>
            <Select
              value={mode}
              onValueChange={(v) => {
                setMode(v as TaxMode);
                if (v === "none") setRate("0");
              }}
            >
              <SelectTrigger id="tax_mode" className="max-w-[240px]">
                <SelectValue>{TAX_MODE_LABELS[mode]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TAX_MODE_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tax_rate">
              Default rate (%)
            </Label>
            <NumberInput
              id="tax_rate"
              min={0}
              max={100}
              step={0.01}
              value={rateDisabled ? "0" : rate}
              onChange={(e) => setRate(e.target.value)}
              disabled={rateDisabled}
              className="max-w-[160px]"
              placeholder="e.g. 5"
            />
            {!rateDisabled && (
              <p className="text-xs text-muted-foreground">
                {mode === "cgst_sgst"
                  ? `Each of CGST and SGST will be ${(Number(rate) / 2).toFixed(2)}%.`
                  : `${TAX_MODE_LABELS[mode]} at ${rate}% will be added on top of the taxable subtotal.`}
              </p>
            )}
          </div>

          {serverError && (
            <Alert variant="destructive">
              <AlertTitle>Could not save</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {saved && (
            <p className="text-sm text-[var(--success)]">Saved.</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
