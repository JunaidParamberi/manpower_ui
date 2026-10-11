"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { ArrowRightIcon } from "lucide-react";

import {
  clientNameFormCopy,
  initialClientNameFormKind,
  type ClientNameFormKind,
} from "@/lib/clients/client-name-form-copy";
import { completeOnboarding } from "@/lib/onboarding/actions";
import { createClient } from "@/lib/clients/client-mutations";
import { CLIENT_LIMITS } from "@/lib/validations/client";
import {
  FORM_CARD_CONTENT_BEFORE_FOOTER,
  FORM_CARD_FOOTER_ONBOARDING_SPLIT,
} from "@/lib/ui/form-card";
import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { CurrencySelect } from "@/components/shared/currency-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingCompleteLoader } from "@/components/onboarding/onboarding-complete-loader";

export type FirstClientFormValues = {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  currency: string;
  notes: string;
};

const defaults: FirstClientFormValues = {
  name: "",
  contact_name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  currency: "",
  notes: "",
};

export function FirstClientOnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completedClientName, setCompletedClientName] = useState<string | null>(
    null,
  );
  const clientCreatedRef = useRef(false);
  const [nameKind, setNameKind] = useState<ClientNameFormKind>(() =>
    initialClientNameFormKind({
      company: defaults.company,
      contact_name: defaults.contact_name,
    }),
  );
  const nameCopy = useMemo(() => clientNameFormCopy(nameKind), [nameKind]);

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FirstClientFormValues>({
    defaultValues: defaults,
  });

  useEffect(() => {
    if (nameKind === "person") {
      setValue("contact_name", "", { shouldDirty: true });
    }
  }, [nameKind, setValue]);

  // Warm the dashboard route so the post-ceremony navigation lands instantly.
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  // Runs once the loader's setup ceremony finishes. Marking onboarding
  // complete here — not before the ceremony starts — keeps the onboarding
  // layout's server guard from redirecting to /dashboard mid-animation.
  async function finalizeOnboarding() {
    const done = await completeOnboarding();
    if (!done.ok) {
      setServerError(done.message);
      setCompleting(false);
      return;
    }
    router.push("/dashboard");
  }

  function skipToDashboard() {
    setServerError(null);
    clearErrors();
    setCompletedClientName(null);
    setCompleting(true);
  }

  function onSaveAndFinish(values: FirstClientFormValues) {
    setServerError(null);
    clearErrors();
    startTransition(async () => {
      if (!clientCreatedRef.current) {
        const created = await createClient(values);
        if (!created.ok) {
          setServerError(created.message);
          if (created.fieldErrors) {
            // Field errors for inputs this form renders are shown inline.
            // Errors for fields the onboarding form omits (billing_email,
            // tax_id, …) can't be highlighted — surface them in the alert
            // instead of swallowing them silently.
            const unmappedMessages: string[] = [];
            (
              Object.entries(created.fieldErrors) as [
                keyof FirstClientFormValues,
                string[] | undefined,
              ][]
            ).forEach(([key, msgs]) => {
              const msg = msgs?.[0];
              if (!msg) return;
              if (key in defaults) {
                setError(key, { message: msg });
              } else {
                unmappedMessages.push(`${String(key)}: ${msg}`);
              }
            });
            if (unmappedMessages.length > 0) {
              setServerError(
                `${created.message} (${unmappedMessages.join("; ")})`,
              );
            }
          }
          return;
        }
        clientCreatedRef.current = true;
      }

      reset(defaults);
      setCompletedClientName(values.name?.trim() || null);
      setCompleting(true);
    });
  }

  if (completing) {
    return (
      <OnboardingCompleteLoader
        clientName={completedClientName}
        onComplete={finalizeOnboarding}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className="text-[13.5px] leading-[1.55] text-[var(--fg-2)]">
          Add someone real — we&apos;ll pre-fill their info on your first invoice.
          Skip and add clients later from the dashboard.
        </p>
        <p className="text-[13px] leading-[1.55] text-[var(--fg-3)]">
          Only you can see this. Your client won&apos;t be notified until you send
          something.
        </p>
      </div>

        <form
          className="flex flex-col gap-7"
          onSubmit={handleSubmit(onSaveAndFinish)}
          noValidate
        >
          <CardTitle className="sr-only">First client</CardTitle>
          <div className="flex flex-col gap-6">
              <fieldset className="flex flex-col gap-0 border-0 p-0">
                <legend className="mb-0 w-full text-sm leading-none font-medium text-foreground">
                  {nameCopy.kindLegend}
                </legend>
                <div className="mt-5 flex flex-col gap-4 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-3">
                  <label
                    className={cn(
                      "flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors sm:flex-1 sm:basis-0",
                      nameKind === "person"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="onboarding_client_name_kind_ui"
                      className="size-4 shrink-0 accent-primary"
                      checked={nameKind === "person"}
                      onChange={() => setNameKind("person")}
                    />
                    {nameCopy.kindPersonLabel}
                  </label>
                  <label
                    className={cn(
                      "flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors sm:flex-1 sm:basis-0",
                      nameKind === "organization"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="onboarding_client_name_kind_ui"
                      className="size-4 shrink-0 accent-primary"
                      checked={nameKind === "organization"}
                      onChange={() => setNameKind("organization")}
                    />
                    {nameCopy.kindOrgLabel}
                  </label>
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <Label htmlFor="client_name">
                    {nameCopy.nameLabel} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="client_name"
                    autoComplete={nameCopy.nameAutocomplete}
                    maxLength={CLIENT_LIMITS.name}
                    placeholder={nameCopy.namePlaceholder}
                    aria-invalid={Boolean(errors.name)}
                    {...register("name", {
                      required: "Display name is required.",
                    })}
                  />
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {nameCopy.nameHelper}
                  </p>
                  {errors.name ? (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    autoComplete="email"
                    maxLength={CLIENT_LIMITS.email}
                    placeholder="name@company.com"
                    aria-invalid={Boolean(errors.email)}
                    {...register("email")}
                  />
                  {errors.email ? (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="client_phone">Phone</Label>
                  <Input
                    id="client_phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={CLIENT_LIMITS.phone}
                    aria-invalid={Boolean(errors.phone)}
                    {...register("phone")}
                  />
                  {errors.phone ? (
                    <p className="text-xs text-destructive">
                      {errors.phone.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <Separator />

              {nameKind === "organization" ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="client_contact_name">
                    {nameCopy.contactNameLabel}
                  </Label>
                  <Input
                    id="client_contact_name"
                    autoComplete="name"
                    maxLength={CLIENT_LIMITS.contact_name}
                    placeholder={nameCopy.contactNamePlaceholder}
                    aria-invalid={Boolean(errors.contact_name)}
                    {...register("contact_name")}
                  />
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {nameCopy.contactNameHelper}
                  </p>
                  {errors.contact_name ? (
                    <p className="text-xs text-destructive">
                      {errors.contact_name.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="client_company">{nameCopy.companyLabel}</Label>
                <Input
                  id="client_company"
                  autoComplete="organization"
                  maxLength={CLIENT_LIMITS.company}
                  aria-invalid={Boolean(errors.company)}
                  {...register("company")}
                />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {nameCopy.companyHelper}
                </p>
                {errors.company ? (
                  <p className="text-xs text-destructive">
                    {errors.company.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="client_address">Address</Label>
                <Textarea
                  id="client_address"
                  rows={3}
                  maxLength={CLIENT_LIMITS.address}
                  placeholder="Street, city, region…"
                  aria-invalid={Boolean(errors.address)}
                  {...register("address")}
                />
                {errors.address ? (
                  <p className="text-xs text-destructive">
                    {errors.address.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="client_currency">Currency</Label>
                  <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                      <CurrencySelect
                        id="client_currency"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        allowInherit
                        invalid={Boolean(errors.currency)}
                      />
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional. Use your profile default unless this client pays in
                    another currency.
                  </p>
                  {errors.currency ? (
                    <p className="text-xs text-destructive">
                      {errors.currency.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="client_notes">Notes</Label>
                <Textarea
                  id="client_notes"
                  rows={4}
                  maxLength={CLIENT_LIMITS.notes}
                  placeholder="Contract terms, preferences…"
                  aria-invalid={Boolean(errors.notes)}
                  {...register("notes")}
                />
                {errors.notes ? (
                  <p className="text-xs text-destructive">
                    {errors.notes.message}
                  </p>
                ) : null}
              </div>

              {serverError ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not finish setup</AlertTitle>
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Link
              href="/onboarding/brand"
              className="text-sm font-medium text-[var(--fg-2)] transition-colors hover:text-foreground"
            >
              ← Back
            </Link>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={skipToDashboard}
                className="text-sm font-medium text-[var(--fg-3)] transition-colors hover:text-[var(--fg-2)] disabled:opacity-50"
              >
                Skip
              </button>
              <Button type="submit" disabled={isPending} className="h-11 rounded-xl px-6">
                {isPending ? (
                  "Saving…"
                ) : (
                  <>
                    Finish setup
                    <ArrowRightIcon className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
    </div>
  );
}
