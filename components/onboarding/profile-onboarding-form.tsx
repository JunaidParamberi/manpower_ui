"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon } from "lucide-react";

import {
  onboardingProfileFormSchema,
  type OnboardingProfileFormValues,
} from "@/lib/validations/onboarding-profile-form";
import { updateProfile, type UpdateProfileResult } from "@/lib/profile/actions";
import type { ProfileRow } from "@/types";
import { cn } from "@/lib/utils";
import { currencyForCountry } from "@/lib/utils/country-currency";
import type { CompanionValues } from "@/lib/onboarding/companion-panel";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/shared/number-input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { CountryCombobox } from "@/components/onboarding/country-combobox";
import { RegionSelect } from "@/components/onboarding/region-select";
import { CurrencySelect } from "@/components/shared/currency-select";
import { getRegionLabel } from "@/lib/data/regions";

function toInput(val: string | null): string {
  return val ?? "";
}

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

type Props = {
  initialProfile: ProfileRow | null;
  onValuesChange?: (values: CompanionValues) => void;
};

export function ProfileOnboardingForm({
  initialProfile,
  onValuesChange,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [serverResult, setServerResult] = useState<UpdateProfileResult | null>(
    null,
  );
  // Once the user picks a currency manually, country changes must not override it.
  const currencyTouched = useRef(false);

  const defaults = useMemo(
    () => ({
      full_name: toInput(initialProfile?.full_name ?? null),
      company_name: toInput(initialProfile?.company_name ?? null),
      vat_registered: initialProfile?.vat_registered ?? false,
      vat_number: toInput(initialProfile?.vat_number ?? null),
      gstin: toInput(initialProfile?.gstin ?? null),
      vat_reg_no: toInput(initialProfile?.vat_reg_no ?? null),
      upi_id: toInput(initialProfile?.upi_id ?? null),
      default_tds_rate: initialProfile?.default_tds_rate ?? 0,
      address_line1: toInput(initialProfile?.address_line1 ?? null),
      address_line2: toInput(initialProfile?.address_line2 ?? null),
      address_city: toInput(initialProfile?.address_city ?? null),
      address_region: toInput(initialProfile?.address_region ?? null),
      address_postal_code: toInput(initialProfile?.address_postal_code ?? null),
      address_country: toInput(initialProfile?.address_country ?? null),
      default_currency: initialProfile?.default_currency ?? "USD",
    }),
    [initialProfile],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingProfileFormValues>({
    resolver: zodResolver(onboardingProfileFormSchema),
    defaultValues: defaults,
  });

  const vatRegistered = watch("vat_registered");
  const addressCountry = watch("address_country");
  const addressRegion = watch("address_region");
  const defaultCurrency = watch("default_currency");
  const regionLabel = getRegionLabel(addressCountry);

  useEffect(() => {
    const sub = watch((v) =>
      onValuesChange?.({
        fullName: v.full_name,
        companyName: v.company_name,
        country: v.address_country,
        currency: v.default_currency,
      }),
    );
    onValuesChange?.({
      fullName: defaults.full_name,
      companyName: defaults.company_name,
      country: defaults.address_country,
      currency: defaults.default_currency,
    });
    return () => sub.unsubscribe();
  }, [watch, onValuesChange, defaults]);

  // Keep the compliance accordion open whenever a field inside it has an error,
  // so validation feedback is never hidden behind a collapsed panel.
  const hasComplianceError = Boolean(
    errors.vat_number ||
      errors.gstin ||
      errors.vat_reg_no ||
      errors.upi_id ||
      errors.default_tds_rate,
  );
  const [complianceOpen, setComplianceOpen] = useState<string[]>([]);
  const accordionValue: string[] = hasComplianceError
    ? ["compliance"]
    : complianceOpen;

  function onSubmit(values: OnboardingProfileFormValues) {
    setServerResult(null);
    startTransition(async () => {
      const patch = {
        full_name: emptyToNull(values.full_name),
        company_name: emptyToNull(values.company_name),
        vat_registered: values.vat_registered,
        vat_number: values.vat_registered
          ? emptyToNull(values.vat_number)
          : null,
        gstin: emptyToNull(values.gstin),
        vat_reg_no: emptyToNull(values.vat_reg_no),
        upi_id: emptyToNull(values.upi_id),
        default_tds_rate: values.default_tds_rate,
        address_line1: emptyToNull(values.address_line1),
        address_line2: emptyToNull(values.address_line2),
        address_city: emptyToNull(values.address_city),
        address_region: emptyToNull(values.address_region),
        address_postal_code: emptyToNull(values.address_postal_code),
        address_country:
          emptyToNull(values.address_country)?.toUpperCase() ?? null,
        default_currency: values.default_currency,
      };

      const result = await updateProfile(patch);
      setServerResult(result);
      if (result.ok) {
        window.location.href = "/onboarding/brand";
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-[13.5px] leading-[1.55] text-[var(--fg-2)]">
          This is what clients will see on documents and your portal.
        </p>
        <p className="text-[12.5px] text-[var(--fg-3)]">
          ~2 min · skip anything, change it later in Settings.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-7">
        <h2 className="sr-only">Profile basics</h2>

        {/* Identity */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              placeholder="Jane Doe"
              autoComplete="name"
              aria-invalid={Boolean(errors.full_name)}
              {...register("full_name")}
            />
            {errors.full_name ? (
              <p className="text-xs text-destructive">
                {errors.full_name.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="company_name">Company name</Label>
            <Input
              id="company_name"
              placeholder="Studio name or sole trader"
              autoComplete="organization"
              aria-invalid={Boolean(errors.company_name)}
              {...register("company_name")}
            />
            {errors.company_name ? (
              <p className="text-xs text-destructive">
                {errors.company_name.message}
              </p>
            ) : null}
          </div>
        </div>

        <Separator />

        {/* Address — country first so region + currency cascade before typing */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="address_country">Country</Label>
            <CountryCombobox
              id="address_country"
              value={addressCountry}
              onChange={(code) => {
                setValue("address_country", code, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                setValue("address_region", "", {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                // Auto-fill currency from country unless the user already chose one.
                if (!currencyTouched.current) {
                  const mapped = currencyForCountry(code);
                  if (mapped) {
                    setValue("default_currency", mapped, {
                      shouldDirty: true,
                    });
                  }
                }
              }}
              aria-invalid={Boolean(errors.address_country)}
            />
            {errors.address_country ? (
              <p className="text-xs text-destructive">
                {errors.address_country.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="address_line1">Street address</Label>
            <Input
              id="address_line1"
              placeholder="123 Sheikh Zayed Rd"
              autoComplete="address-line1"
              aria-invalid={Boolean(errors.address_line1)}
              {...register("address_line1")}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="address_line2">
              Apartment, suite, office, building
            </Label>
            <Input
              id="address_line2"
              placeholder="Office 1203, Burj Khalifa"
              autoComplete="address-line2"
              {...register("address_line2")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address_city">City</Label>
            <Input
              id="address_city"
              placeholder="Dubai"
              autoComplete="address-level2"
              {...register("address_city")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address_region">{regionLabel}</Label>
            <RegionSelect
              id="address_region"
              countryCode={addressCountry}
              value={addressRegion}
              onChange={(v) =>
                setValue("address_region", v, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              aria-invalid={Boolean(errors.address_region)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address_postal_code">Postal / ZIP code</Label>
            <Input
              id="address_postal_code"
              placeholder="00000"
              autoComplete="postal-code"
              {...register("address_postal_code")}
            />
          </div>
        </div>

        <Separator />

        {/* Default currency */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="default_currency">Default currency</Label>
          <CurrencySelect
            id="default_currency"
            value={defaultCurrency ?? "USD"}
            onChange={(val) => {
              currencyTouched.current = true;
              setValue("default_currency", val, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          />
          <p className="text-xs text-muted-foreground">
            Auto-filled from your country. Used for invoices when no client
            currency is set.
          </p>
        </div>

        {/* Tax & compliance — collapsed by default, opens on error */}
        <Accordion
          value={accordionValue}
          onValueChange={(val) => setComplianceOpen(val as string[])}
        >
          <AccordionItem value="compliance" className="border-b-0">
            <AccordionTrigger className="text-sm font-medium">
              Tax &amp; compliance (optional)
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4 pt-1">
                {addressCountry !== "IN" ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="vat_registered"
                      checked={vatRegistered}
                      onCheckedChange={(checked) => {
                        const next = checked === true;
                        setValue("vat_registered", next, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        if (!next) setValue("vat_number", "");
                      }}
                    />
                    <Label
                      htmlFor="vat_registered"
                      className="text-sm font-medium leading-none"
                    >
                      VAT registered
                    </Label>
                  </div>
                ) : null}
                {addressCountry !== "IN" ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="vat_number">VAT number</Label>
                  <Input
                    id="vat_number"
                    type="text"
                    autoComplete="off"
                    disabled={!vatRegistered}
                    aria-invalid={Boolean(errors.vat_number)}
                    {...register("vat_number")}
                    className={cn(!vatRegistered && "text-muted-foreground")}
                  />
                  {errors.vat_number ? (
                    <p className="text-xs text-destructive">
                      {errors.vat_number.message}
                    </p>
                  ) : null}
                </div>
                ) : null}
                {addressCountry === "IN" ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="gstin">GSTIN</Label>
                      <Input
                        id="gstin"
                        type="text"
                        autoComplete="off"
                        placeholder="29ABCDE1234F1Z5"
                        aria-invalid={Boolean(errors.gstin)}
                        {...register("gstin")}
                      />
                      {errors.gstin ? (
                        <p className="text-xs text-destructive">
                          {errors.gstin.message}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="upi_id">UPI ID</Label>
                      <Input
                        id="upi_id"
                        type="text"
                        autoComplete="off"
                        placeholder="yourname@oksbi"
                        aria-invalid={Boolean(errors.upi_id)}
                        {...register("upi_id")}
                      />
                      {errors.upi_id ? (
                        <p className="text-xs text-destructive">
                          {errors.upi_id.message}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Shown as a scannable QR on your invoice payment page
                        (India only).
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="default_tds_rate">
                        Default TDS Rate (%)
                      </Label>
                      <NumberInput
                        id="default_tds_rate"
                        min={0}
                        max={100}
                        step={0.5}
                        autoComplete="off"
                        placeholder="0"
                        aria-invalid={Boolean(errors.default_tds_rate)}
                        {...register("default_tds_rate", {
                          valueAsNumber: true,
                        })}
                      />
                      {errors.default_tds_rate ? (
                        <p className="text-xs text-destructive">
                          {errors.default_tds_rate.message}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Pre-filled on new invoices (India only).
                      </p>
                    </div>
                  </>
                ) : null}
                {addressCountry === "GB" ? (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="vat_reg_no">VAT Reg No</Label>
                    <Input
                      id="vat_reg_no"
                      type="text"
                      autoComplete="off"
                      placeholder="GB123456789"
                      aria-invalid={Boolean(errors.vat_reg_no)}
                      {...register("vat_reg_no")}
                    />
                    {errors.vat_reg_no ? (
                      <p className="text-xs text-destructive">
                        {errors.vat_reg_no.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {serverResult && !serverResult.ok ? (
          <Alert variant="destructive">
            <AlertTitle>Could not save profile</AlertTitle>
            <AlertDescription>{serverResult.message}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--fg-3)] transition-colors hover:text-[var(--fg-2)]"
          >
            Skip
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="h-11 rounded-xl px-6"
          >
            {isPending ? (
              "Saving…"
            ) : (
              <>
                Continue
                <ArrowRightIcon className="size-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
