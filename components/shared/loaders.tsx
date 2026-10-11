"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { AiIcon } from "@/components/shared/ai-icon";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

type SpinnerProps = {
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "muted" | "on-accent";
  className?: string;
};

const SPINNER_SIZES = { sm: 14, md: 18, lg: 24, xl: 32 };
const SPINNER_WIDTHS = { sm: 1.5, md: 2, lg: 2.5, xl: 3 };

export function Spinner({ size = "md", tone = "muted", className }: SpinnerProps) {
  const px = SPINNER_SIZES[size];
  const sw = SPINNER_WIDTHS[size];
  const color = tone === "on-accent" ? "#fff" : "var(--fg-3)";
  const r = (px - sw) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      className={cn("spinner", className)}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeOpacity={0.25}
        strokeWidth={sw}
      />
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${circ * 0.25} ${circ * 0.75}`}
        transform={`rotate(-90 ${px / 2} ${px / 2})`}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// DotPulse
// ---------------------------------------------------------------------------

type DotPulseProps = {
  accent?: boolean;
  className?: string;
};

export function DotPulse({ accent = false, className }: DotPulseProps) {
  const color = accent ? "var(--border-focus)" : "var(--fg-3)";
  return (
    <div
      className={cn("dot-pulse", className)}
      role="status"
      aria-label="Loading"
      style={{ display: "inline-flex", gap: 4, alignItems: "center" }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="dot-pulse__dot"
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: color,
            display: "inline-block",
            animationDelay: `${i * 160}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProgressIndeterminate
// ---------------------------------------------------------------------------

type ProgressIndeterminateProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function ProgressIndeterminate({ className, style }: ProgressIndeterminateProps) {
  return (
    <div
      className={cn("progress-indet", className)}
      role="progressbar"
      aria-label="Loading"
      aria-valuenow={undefined}
      style={{
        position: "relative",
        height: 3,
        width: "100%",
        background: "var(--bg-subtle)",
        overflow: "hidden",
        ...style,
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// AIThinking
// ---------------------------------------------------------------------------

type AIThinkingProps = {
  label?: string;
  size?: number;
  className?: string;
};

export function AIThinking({
  label = "Thinking",
  size = 15,
  className,
}: AIThinkingProps) {
  return (
    <div
      className={cn("ai-thinking", className)}
      role="status"
      aria-label={label}
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
    >
      <AiIcon
        size={size}
        className="ai-thinking__icon"
        style={{ color: "var(--border-focus)", flexShrink: 0 }}
      />
      <span
        className="ai-thinking__text"
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 500,
          color: "var(--fg-3)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InlineLoader
// ---------------------------------------------------------------------------

type InlineLoaderProps = {
  label?: string;
  className?: string;
};

export function InlineLoader({ label = "Saving changes", className }: InlineLoaderProps) {
  return (
    <div
      className={cn("inline-flex items-center gap-2", className)}
      role="status"
      aria-label={label}
    >
      <Spinner size="sm" />
      <span style={{ fontSize: "var(--text-sm)", color: "var(--fg-3)" }}>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ButtonLoading — wraps any button; hides children but preserves width
// ---------------------------------------------------------------------------

type ButtonLoadingProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  tone?: "muted" | "on-accent";
  children: ReactNode;
};

export function ButtonLoading({
  loading = false,
  tone = "on-accent",
  children,
  className,
  disabled,
  ...props
}: ButtonLoadingProps) {
  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      className={className}
      style={{ position: "relative", ...props.style }}
    >
      <span style={{ visibility: loading ? "hidden" : "visible" }}>{children}</span>
      {loading && (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Spinner size="sm" tone={tone} />
        </span>
      )}
    </button>
  );
}
