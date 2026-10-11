"use client";

import type { ComponentType, CSSProperties, ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type KpiTone = "default" | "info" | "success" | "warning" | "danger";

const TONE_STYLES: Record<
  Exclude<KpiTone, "default">,
  { soft: string; fg: string }
> = {
  info: { soft: "var(--info-soft)", fg: "var(--info)" },
  success: { soft: "var(--success-soft)", fg: "var(--success)" },
  warning: { soft: "var(--warning-soft)", fg: "var(--warning)" },
  danger: { soft: "var(--danger-soft)", fg: "var(--danger)" },
};

export type KpiCardProps = {
  label: string;
  value: ReactNode;
  delta?: string | null;
  trend?: "up" | "down" | "flat";
  sub?: ReactNode | null;
  delay?: number;
  href?: string;
  variant?: "default" | "warning" | "danger";
  tone?: KpiTone;
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  onClick?: () => void;
  active?: boolean;
  className?: string;
};

export function KpiCard({
  label,
  value,
  delta,
  trend = "flat",
  sub,
  delay = 0,
  href,
  variant = "default",
  tone = "default",
  icon: Icon,
  onClick,
  active = false,
  className,
}: KpiCardProps) {
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  const interactive = Boolean(Icon ?? onClick ?? href);
  const toneKey = tone !== "default" ? tone : null;
  const toneStyle = toneKey ? TONE_STYLES[toneKey] : null;

  const deltaClass =
    variant === "danger"
      ? "text-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
      : variant === "warning"
        ? "text-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_10%,transparent)]"
        : trend === "up"
          ? "text-[var(--success)] bg-[color-mix(in_srgb,var(--success)_10%,transparent)]"
          : trend === "down"
            ? "text-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]"
            : "text-muted-foreground bg-muted";

  const subClass =
    variant === "danger"
      ? "text-[var(--danger)]"
      : variant === "warning"
        ? "text-[var(--warning)]"
        : toneStyle && active
          ? toneStyle.fg
          : "text-muted-foreground";

  const cardClassName = cn(
    "relative w-full overflow-hidden rounded-xl border border-border bg-card text-left shadow-[var(--shadow-xs)]",
    "opacity-0 animate-[fadeUp_0.45s_ease_forwards]",
    interactive ? "min-h-[84px] px-4 py-3.5" : "px-4 py-3.5",
    !interactive && variant === "danger" &&
      "border-[color-mix(in_srgb,var(--danger)_25%,var(--border))]",
    !interactive && variant === "warning" &&
      "border-[color-mix(in_srgb,var(--warning)_25%,var(--border))]",
    interactive && "flex items-center justify-between gap-3 transition-colors",
    interactive && active && toneStyle && "border-transparent",
    interactive &&
      !active &&
      "hover:border-[var(--border-focus)] hover:shadow-[var(--shadow-sm,0_1px_4px_rgba(0,0,0,0.06))]",
    (href || onClick) && "cursor-pointer",
    className,
  );

  const cardStyle: CSSProperties = {
    animationDelay: `${delay}ms`,
    ...(interactive && active && toneStyle
      ? { background: toneStyle.soft }
      : {}),
  };

  const labelStyle: CSSProperties | undefined =
    interactive && active && toneStyle ? { color: toneStyle.fg } : undefined;

  const valueStyle: CSSProperties | undefined =
    interactive && active && toneStyle ? { color: toneStyle.fg } : undefined;

  const content = interactive ? (
    <>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "mb-1 text-meta leading-tight",
            !active && "text-muted-foreground",
          )}
          style={labelStyle}
        >
          {label}
        </div>
        <p
          className="font-heading text-[22px] font-semibold tabular-nums tracking-[-0.022em] leading-none"
          style={valueStyle}
        >
          {value}
        </p>
      </div>
      {Icon ? (
        <div
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg",
            active ? "opacity-100" : "opacity-70",
          )}
          style={
            toneStyle
              ? { background: toneStyle.soft, color: toneStyle.fg }
              : { background: "var(--bg-subtle)", color: "var(--fg-2)" }
          }
        >
          <Icon size={15} strokeWidth={1.6} />
        </div>
      ) : null}
    </>
  ) : (
    <>
      <div className="mb-1.5 text-meta leading-tight text-[var(--fg-2)]">
        {label}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <p className="min-w-0 font-heading text-[22px] font-semibold tabular-nums tracking-[-0.022em] text-foreground leading-none">
          {value}
        </p>
        {delta ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-[7px] py-[3px]",
              "text-label font-medium tabular-nums",
              deltaClass,
            )}
          >
            <TrendIcon size={11} strokeWidth={2} />
            {delta}
          </span>
        ) : null}
      </div>
      {sub != null ? (
        <p className={cn("mt-2 text-meta leading-snug", subClass)}>{sub}</p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClassName} style={cardStyle}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cardClassName}
        style={cardStyle}
        aria-pressed={active}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cardClassName} style={cardStyle}>
      {content}
    </div>
  );
}
