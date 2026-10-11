"use client";

import { cn } from "@/lib/utils";

export function PillSwitch<T extends string>({
  label, options, value, onChange, disabled,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 px-2 pt-1 pb-1.5">
      {options.map((o) => {
        const on = o.value === value;
        if (disabled && !on) return null;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-[26px] rounded-full border px-2.5 text-[12px] shadow-[var(--shadow-xs)] transition-colors",
              on
                ? "border-[var(--fg)] bg-[var(--fg)] text-[var(--bg-surface)]"
                : "border-border bg-[var(--bg-surface)] text-[var(--fg-2)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
