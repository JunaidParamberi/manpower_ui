"use client";

import { useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { AiIcon } from "@/components/shared/ai-icon";
import { AmbientBackdrop } from "@/components/shared/ambient/ambient-backdrop";
import { GradientText } from "@/components/shared/ambient/gradient-text";
import { cn } from "@/lib/utils";
import {
  type CompanionValues,
  type CompanionVariant,
  companionHeadline,
  displayStudioName,
  displayInvoiceMeta,
} from "@/lib/onboarding/companion-panel";

export function CompanionPanel({
  variant,
  values = {},
  className,
}: {
  variant: CompanionVariant;
  values?: CompanionValues;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = Boolean(prefersReducedMotion);

  return (
    <aside
      aria-hidden
      className={cn(
        "relative hidden h-full overflow-hidden border-s border-[var(--border)] lg:flex lg:items-center lg:justify-center",
        className,
      )}
      style={{
        background:
          "linear-gradient(160deg, var(--accent-soft) 0%, var(--bg-canvas) 70%)",
      }}
    >
      <AmbientBackdrop reduced={reduced} density="default" />

      <div className="relative z-10 w-full max-w-[460px] px-10 xl:px-12">
        <div className="auth-preview-card" style={{ animationDelay: "0ms" }}>
          <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--fg-3)]">
            Manpower · v1
          </div>
          <h2 className="mb-7 font-heading text-[2.25rem] font-semibold leading-[1.07] tracking-[-0.03em]">
            <GradientText as="span">{companionHeadline(variant)}</GradientText>
          </h2>
        </div>
        {variant === "auth" ? <AuthPreview /> : null}
        {variant === "profile" ? <InvoicePreview values={values} /> : null}
        {variant === "brand" ? <BrandPreview values={values} /> : null}
        {variant === "client" ? <ClientPreview values={values} /> : null}
      </div>
    </aside>
  );
}

function PreviewCard({ children, delay, className }: { children: React.ReactNode; delay: string; className?: string }) {
  return (
    <div
      className={cn(
        "auth-preview-card rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-3.5 shadow-[var(--shadow-lg)]",
        className,
      )}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}

function InvoicePreview({ values }: { values: CompanionValues }) {
  const meta = displayInvoiceMeta(values);
  return (
    <div className="grid gap-3" style={{ transform: "perspective(900px) rotateY(-3deg) rotateX(2deg)" }}>
      <PreviewCard delay="120ms">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-heading text-[17px] font-semibold tracking-[-0.02em] text-foreground">
              {meta.name}
            </div>
            <div className="truncate text-[12px] text-[var(--fg-3)]">{meta.sub}</div>
          </div>
          <span className="shrink-0 rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            {meta.currencyBadge}
          </span>
        </div>
        <div className="mt-3 h-px bg-[var(--border)]" />
        <div className="mt-3 space-y-1.5">
          <div className="h-2 w-2/3 rounded bg-[var(--bg-subtle)]" />
          <div className="h-2 w-1/2 rounded bg-[var(--bg-subtle)]" />
        </div>
      </PreviewCard>
      <PreviewCard delay="220ms" className="ml-8">
        <div className="text-[11px] text-[var(--fg-3)]">Invoice total</div>
        <div className="font-heading text-[20px] font-semibold tabular-nums tracking-[-0.022em] text-foreground">
          {meta.currencyBadge} 4,200
        </div>
      </PreviewCard>
    </div>
  );
}

function BrandPreview({ values }: { values: CompanionValues }) {
  const primary = values.primaryColor ?? "#0a0a0a";
  const secondary = values.secondaryColor ?? "#fafafa";
  const font = values.font ?? "Inter";
  return (
    <PreviewCard delay="120ms">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg border border-[var(--border)]" style={{ background: primary }} />
        <div className="size-10 rounded-lg border border-[var(--border)]" style={{ background: secondary }} />
        <div className="min-w-0">
          <div className="truncate text-[20px] font-semibold text-foreground" style={{ fontFamily: font }}>
            {displayStudioName(values)}
          </div>
          <div className="text-[11px] text-[var(--fg-3)]">{font}</div>
        </div>
      </div>
    </PreviewCard>
  );
}

function ClientPreview({ values }: { values: CompanionValues }) {
  return (
    <PreviewCard delay="120ms">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--fg-3)]">Client portal</div>
      <div className="mt-1 font-heading text-[18px] font-semibold text-foreground">
        {displayStudioName(values)}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--bg-subtle)]/60 px-3 py-2">
        <CheckCircle2 className="size-4 text-[var(--success)]" strokeWidth={1.8} />
        <span className="text-[12px] text-[var(--fg-2)]">Invoice ready to view</span>
      </div>
    </PreviewCard>
  );
}

function AuthPreview() {
  return (
    <div className="grid gap-3" style={{ transform: "perspective(900px) rotateY(-3deg) rotateX(2deg)" }}>
      <PreviewCard delay="120ms">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <AiIcon size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-foreground">Drafted follow-up for Atlas Studio</div>
            <div className="mt-0.5 truncate text-[11px] text-[var(--fg-3)]">Ready in your outbox · INV-2049</div>
          </div>
          <span className="shrink-0 rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-primary">AI</span>
        </div>
      </PreviewCard>
      <PreviewCard delay="220ms" className="ml-8">
        <div className="mb-1 text-[11px] text-[var(--fg-3)]">Revenue this month</div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading text-[22px] font-semibold tabular-nums tracking-[-0.022em] text-foreground">AED 42,180</span>
          <span className="rounded-md bg-[var(--success-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--success)]">+18%</span>
        </div>
      </PreviewCard>
    </div>
  );
}
