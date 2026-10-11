"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/shared/number-input";
import { Label } from "@/components/ui/label";
import { CurrencySelect } from "@/components/shared/currency-select";
import { updateProfile } from "@/lib/profile/actions";
import type { ProfileRow } from "@/types";

type Props = {
  profile: ProfileRow;
};

export function ProfileSettingsForm({ profile }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [companyName, setCompanyName] = useState(profile.company_name ?? "");
  const [currency, setCurrency] = useState(profile.default_currency ?? "USD");
  const [upiId, setUpiId] = useState(profile.upi_id ?? "");
  const [defaultTdsRate, setDefaultTdsRate] = useState(String(profile.default_tds_rate ?? 0));
  const isIndia = profile.address_country === "IN";

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfile({
        full_name: fullName.trim() || null,
        company_name: companyName.trim() || null,
        default_currency: currency,
        upi_id: upiId.trim() || null,
        default_tds_rate: isIndia ? (parseFloat(defaultTdsRate) || 0) : undefined,
      });
      if (!result.ok) {
        setServerError(result.message);
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
          <CardTitle>Personal details</CardTitle>
          <CardDescription>
            Used across invoices, the portal, and AI drafts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="company_name">Company name</Label>
            <Input
              id="company_name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Optional"
              autoComplete="organization"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="default_currency">Default currency</Label>
            <CurrencySelect
              id="default_currency"
              value={currency}
              onChange={setCurrency}
              className="max-w-[240px]"
            />
            <p className="text-xs text-muted-foreground">
              Used for invoices when no client currency is set, and across the
              dashboard.
            </p>
          </div>

          {isIndia ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="upi_id">UPI ID</Label>
                <Input
                  id="upi_id"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@oksbi"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Shown as a scannable QR on your invoice payment page (India only).
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="default_tds_rate">Default TDS Rate (%)</Label>
                <NumberInput
                  id="default_tds_rate"
                  min={0}
                  max={100}
                  step={0.5}
                  value={defaultTdsRate}
                  onChange={(e) => setDefaultTdsRate(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Pre-filled on new invoices (India only).
                </p>
              </div>
            </>
          ) : null}

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
