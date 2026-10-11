"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, CheckIcon, ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { skipBrandOnboarding } from "@/lib/onboarding/actions";
import { saveBrandKit } from "@/lib/brand-kit/actions";
import {
  brandKitFormSchema,
  type BrandKitFormValues,
} from "@/lib/validations/brand-kit";
import type { BrandKitRow } from "@/types";
import type { CompanionValues } from "@/lib/onboarding/companion-panel";
import {
  FORM_CARD_CONTENT_BEFORE_FOOTER,
  FORM_CARD_FOOTER_ONBOARDING_SPLIT,
} from "@/lib/ui/form-card";
import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const FONT_OPTIONS = [
  "Inter",
  "Hanken Grotesk",
  "DM Sans",
  "IBM Plex Sans",
  "Source Serif 4",
  "Playfair Display",
  "Geist",
  "JetBrains Mono",
] as const;

type Props = {
  initialBrandKit: BrandKitRow | null;
  /** Default `/onboarding/client`. Pass `false` to only `router.refresh()` (protected test harness). */
  redirectAfterSave?: string | false;
  backHref?: string;
  backLabel?: string;
  submitLabel?: string;
  variant?: "default" | "onboarding";
  onValuesChange?: (values: CompanionValues) => void;
};

export function BrandKitForm({
  initialBrandKit,
  redirectAfterSave,
  backHref: backHrefProp,
  backLabel: backLabelProp,
  submitLabel: submitLabelProp,
  variant = "default",
  onValuesChange,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined> | undefined
  >();
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  // The default variant only renders a back link when the caller passes backHref
  // (see defaultFooter), so this fallback exists for the onboarding flow alone.
  const backHref = backHrefProp ?? "/onboarding/profile";
  const backLabel =
    backLabelProp ?? (variant === "onboarding" ? "← Back" : "Back");
  const submitLabel =
    submitLabelProp ?? (variant === "onboarding" ? "Continue" : "Save and continue");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BrandKitFormValues>({
    resolver: zodResolver(brandKitFormSchema),
    defaultValues: {
      primary_color: initialBrandKit?.primary_color ?? "#0a0a0a",
      secondary_color: initialBrandKit?.secondary_color ?? "#fafafa",
      font: initialBrandKit?.font ?? "Inter",
      email_signature: initialBrandKit?.email_signature ?? "",
    },
  });

  const primaryColor = watch("primary_color");
  const secondaryColor = watch("secondary_color");
  const font = watch("font");

  useEffect(() => {
    const sub = watch((v) =>
      onValuesChange?.({
        primaryColor: v.primary_color,
        secondaryColor: v.secondary_color,
        font: v.font,
      }),
    );
    onValuesChange?.({
      primaryColor: initialBrandKit?.primary_color ?? undefined,
      secondaryColor: initialBrandKit?.secondary_color ?? undefined,
      font: initialBrandKit?.font ?? undefined,
    });
    return () => sub.unsubscribe();
  }, [watch, onValuesChange, initialBrandKit]);

  const previewLogoSrc =
    logoPreviewUrl ?? initialBrandKit?.logo_url ?? null;

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setLogoPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function onSubmit(values: BrandKitFormValues) {
    setLastError(null);
    setFieldErrors(undefined);
    setSavedOk(false);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("primary_color", values.primary_color);
      fd.append("secondary_color", values.secondary_color);
      fd.append("font", values.font);
      fd.append("email_signature", values.email_signature);
      const file = logoInputRef.current?.files?.[0];
      if (file) {
        fd.append("logo", file);
      }

      const result = await saveBrandKit(fd);
      if (!result.ok) {
        setLastError(result.message);
        setFieldErrors(result.fieldErrors);
        return;
      }
      if (logoInputRef.current) logoInputRef.current.value = "";
      if (variant === "onboarding") {
        window.location.href = "/onboarding/client";
      } else {
        const next =
          typeof redirectAfterSave === "string" ? redirectAfterSave : null;
        if (next) {
          router.replace(next);
        } else {
          router.refresh();
          setSavedOk(true);
          toast.success("Brand kit saved");
        }
      }
    });
  }

  function handleSkip() {
    setLastError(null);
    startTransition(async () => {
      const result = await skipBrandOnboarding();
      if (!result.ok) {
        setLastError(result.message);
        return;
      }
      window.location.href = "/onboarding/client";
    });
  }

  const logoDropzone = (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Workspace logo</span>
      <label
        htmlFor="logo"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)]/40 px-6 py-10 transition-colors hover:bg-[var(--bg-subtle)]",
          variant === "onboarding" && "py-12",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const file = e.dataTransfer.files?.[0];
          if (file && logoInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            logoInputRef.current.files = dt.files;
            handleLogoChange({
              target: logoInputRef.current,
            } as React.ChangeEvent<HTMLInputElement>);
          }
        }}
      >
        <ImageIcon className="size-8 text-[var(--fg-3)]" aria-hidden />
        <span className="text-sm font-medium text-foreground">
          Click to upload or drag and drop
        </span>
        <span className="text-xs text-[var(--fg-3)]">
          SVG, PNG, or JPG (max. 5MB)
        </span>
        <input
          ref={logoInputRef}
          id="logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="sr-only"
          onChange={handleLogoChange}
        />
      </label>
      {initialBrandKit?.logo_url && !logoPreviewUrl ? (
        <p className="text-xs text-[var(--fg-3)]">
          Saving without a new file keeps your current logo.
        </p>
      ) : null}
    </div>
  );

  const ACCENT_SWATCHES = [
    "#3550E0",
    "#1F8A52",
    "#B36A12",
    "#C13838",
    "#7C4DBC",
    "#0F7A8F",
  ] as const;

  const colorPalette = (
    <div className="flex flex-col gap-3">
      <Label>Accent color</Label>
      <div className="flex flex-wrap gap-2">
        {ACCENT_SWATCHES.map((hex) => {
          const isSelected = primaryColor.toUpperCase() === hex.toUpperCase();
          return (
            <button
              key={hex}
              type="button"
              aria-label={`Pick accent ${hex}`}
              onClick={() =>
                setValue("primary_color", hex, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={cn(
                "size-9 rounded-lg transition-transform hover:scale-105",
                isSelected
                  ? "ring-2 ring-[var(--fg)] ring-offset-2 ring-offset-[var(--bg-canvas)]"
                  : "ring-1 ring-[var(--border-strong)]",
              )}
              style={{ background: hex }}
            />
          );
        })}
        <label
          className={cn(
            "relative grid size-9 cursor-pointer place-items-center rounded-lg ring-1 ring-[var(--border-strong)] transition-transform hover:scale-105",
          )}
          style={{
            background:
              "conic-gradient(from 0deg, #ef4444, #f59e0b, #84cc16, #06b6d4, #6366f1, #ec4899, #ef4444)",
          }}
          aria-label="Pick custom color"
        >
          <input
            type="color"
            value={primaryColor}
            onChange={(e) =>
              setValue("primary_color", e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
      {errors.primary_color ? (
        <p className="text-xs text-destructive">{errors.primary_color.message}</p>
      ) : null}
    </div>
  );

  const colorFields = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="primary_color">Primary color</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="primary_color"
            type="text"
            autoComplete="off"
            className="min-w-0 flex-1 font-mono text-xs sm:text-sm"
            aria-invalid={Boolean(errors.primary_color)}
            {...register("primary_color")}
          />
          <input
            type="color"
            className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent"
            aria-label="Primary color picker"
            value={primaryColor}
            onChange={(e) =>
              setValue("primary_color", e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />
        </div>
        {errors.primary_color ? (
          <p className="text-xs text-destructive">{errors.primary_color.message}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="secondary_color">Secondary color</Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="secondary_color"
            type="text"
            autoComplete="off"
            className="min-w-0 flex-1 font-mono text-xs sm:text-sm"
            aria-invalid={Boolean(errors.secondary_color)}
            {...register("secondary_color")}
          />
          <input
            type="color"
            className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent"
            aria-label="Secondary color picker"
            value={secondaryColor}
            onChange={(e) =>
              setValue("secondary_color", e.target.value, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />
        </div>
        {errors.secondary_color ? (
          <p className="text-xs text-destructive">{errors.secondary_color.message}</p>
        ) : null}
      </div>
    </div>
  );

  const fontField =
    variant === "onboarding" ? (
      <div className="flex flex-col gap-2">
        <Label htmlFor="font-select">Brand font (optional)</Label>
        <Select
          value={font}
          onValueChange={(v) => {
            if (v) setValue("font", v, { shouldValidate: true, shouldDirty: true });
          }}
        >
          <SelectTrigger id="font-select" className="w-full min-w-0" size="default">
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f} value={f}>
                  <span className="font-medium">Aa</span> {f}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.font ? (
          <p className="text-xs text-destructive">{errors.font.message}</p>
        ) : null}
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <Label htmlFor="font-select-settings">Brand font</Label>
        <Select
          value={font}
          onValueChange={(v) => {
            if (v) setValue("font", v, { shouldValidate: true, shouldDirty: true });
          }}
        >
          <SelectTrigger id="font-select-settings" className="w-full min-w-0">
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f} value={f}>
                  <span className="font-medium">Aa</span>&nbsp;{f}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {errors.font ? (
          <p className="text-xs text-destructive">{errors.font.message}</p>
        ) : null}
      </div>
    );

  const emailSignatureField =
    variant === "default" ? (
      <div className="flex flex-col gap-2">
        <Label htmlFor="email_signature">Email signature</Label>
        <textarea
          id="email_signature"
          rows={5}
          className={cn(
            "min-h-[120px] w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 dark:bg-input/30",
            errors.email_signature && "border-destructive",
          )}
          placeholder="Best regards, …"
          aria-invalid={Boolean(errors.email_signature)}
          {...register("email_signature")}
        />
        {errors.email_signature ? (
          <p className="text-xs text-destructive">{errors.email_signature.message}</p>
        ) : null}
      </div>
    ) : null;

  const previewSection =
    variant === "onboarding" ? (
      <div className="flex flex-col gap-2">
        <Label>Preview</Label>
        <Card className="overflow-hidden shadow-xs ring-1 ring-foreground/10">
          <CardContent className="flex flex-col gap-4 p-4">
            <div className="flex gap-4">
              <div
                className="w-1.5 shrink-0 self-stretch rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                    {previewLogoSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element -- blob + Supabase URLs
                      <img
                        src={previewLogoSrc}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="size-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 pt-1">
                    <div
                      className="h-2.5 max-w-[55%] rounded-full bg-muted"
                      style={{ fontFamily: font }}
                    />
                    <div className="h-2.5 max-w-[88%] rounded-full bg-muted/70" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <div
                    className="h-9 min-w-[7rem] rounded-md shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ) : null;

  const errorBlock =
    lastError || (fieldErrors && Object.keys(fieldErrors).length > 0) ? (
      variant === "onboarding" ? (
        <Alert variant="destructive">
          <AlertTitle>Could not save brand kit</AlertTitle>
          <AlertDescription>
            <p>{lastError}</p>
            {fieldErrors ? (
              <ul className="mt-2 list-inside list-disc text-xs">
                {Object.entries(fieldErrors).map(([k, msgs]) =>
                  msgs?.length ? (
                    <li key={k}>
                      <span className="font-mono">{k}</span>: {msgs.join(", ")}
                    </li>
                  ) : null,
                )}
              </ul>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <p>{lastError}</p>
          {fieldErrors ? (
            <ul className="mt-1 list-inside list-disc text-xs">
              {Object.entries(fieldErrors).map(([k, msgs]) =>
                msgs?.length ? (
                  <li key={k}>
                    <span className="font-mono">{k}</span>: {msgs.join(", ")}
                  </li>
                ) : null,
              )}
            </ul>
          ) : null}
        </div>
      )
    ) : null;

  const onboardingFooter = (
    <div className="flex items-center justify-between gap-3 pt-2">
      <Link
        href={backHref}
        className="text-sm font-medium text-[var(--fg-2)] transition-colors hover:text-foreground"
      >
        {backLabel}
      </Link>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleSkip}
          className="text-sm font-medium text-[var(--fg-3)] transition-colors hover:text-[var(--fg-2)] disabled:opacity-50"
        >
          Skip
        </button>
        <Button type="submit" disabled={isPending} className="h-11 rounded-xl px-6">
          {isPending ? (
            "Saving…"
          ) : (
            <>
              {submitLabel}
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const defaultFooter = (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : submitLabel}
      </Button>
      {backHrefProp ? (
        <Link
          href={backHref}
          className={cn(buttonVariants({ variant: "outline" }), "inline-flex")}
        >
          {backLabel}
        </Link>
      ) : null}
      {savedOk ? (
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <CheckIcon className="size-4 text-green-600" aria-hidden />
          Saved.
        </span>
      ) : null}
    </div>
  );

  if (variant === "onboarding") {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="text-[13.5px] leading-[1.55] text-[var(--fg-2)]">
            Drop a logo and pick your colors. We&apos;ll use it on every PDF you send.
          </p>
          <p className="text-[12.5px] text-[var(--fg-3)]">
            ~1 min · skip anything, change it later in Settings.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-7"
        >
          <CardTitle className="sr-only">Brand kit</CardTitle>
          <div className="flex flex-col gap-6">
            {initialBrandKit?.logo_url ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[var(--fg-2)]">
                  Current logo on file
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={initialBrandKit.logo_url}
                  alt="Current brand logo"
                  className="h-16 w-16 rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] object-contain p-1"
                />
              </div>
            ) : null}

            {logoDropzone}
            {colorPalette}
            {fontField}
            {previewSection}
            {emailSignatureField}
            {errorBlock}
          </div>
          {onboardingFooter}
        </form>
      </div>
    );
  }

  const settingsPreview = (
    <div className="sticky top-6 flex flex-col gap-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        Preview
      </Label>
      <Card className="overflow-hidden shadow-sm ring-1 ring-border/60">
        <div className="flex flex-col">
          <div
            className="h-1 w-full"
            style={{ backgroundColor: primaryColor }}
          />
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                {previewLogoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element -- blob + Supabase URLs
                  <img
                    src={previewLogoSrc}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="size-4 text-muted-foreground" />
                )}
              </div>
              <span
                className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                style={{ fontFamily: font }}
              >
                Invoice
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div
                className="h-2 w-3/4 rounded-full"
                style={{ backgroundColor: primaryColor, opacity: 0.15 }}
              />
              <div className="h-1.5 w-full rounded-full bg-muted/60" />
              <div className="h-1.5 w-5/6 rounded-full bg-muted/60" />
              <div className="h-1.5 w-2/3 rounded-full bg-muted/40" />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="h-1.5 w-16 rounded-full bg-muted/60" />
                <div className="h-1.5 w-12 rounded-full bg-muted/40" />
              </div>
              <div
                className="rounded-md px-3 py-1.5 text-[10px] font-semibold"
                style={{ backgroundColor: primaryColor, color: secondaryColor }}
              >
                Pay now
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">
        How your brand appears on documents.
      </p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Logo</CardTitle>
              <CardDescription>
                Appears on invoices, proposals, and your client portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-0">
              {logoDropzone}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Colors</CardTitle>
              <CardDescription>
                Primary color for accents; secondary for contrast surfaces.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {colorFields}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Typography</CardTitle>
              <CardDescription>
                Applied to document headings and portal copy.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {fontField}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Email signature</CardTitle>
              <CardDescription>
                Appended to emails sent through Manpower.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {emailSignatureField}
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:block">
          {settingsPreview}
        </div>
      </div>

      {errorBlock}
      {defaultFooter}
    </form>
  );
}
